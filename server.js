var settings = require('./settings');
const Influx = require('influx');
const influx= new Influx.InfluxDB({
	host: settings.db_host,
	database: settings.db_base,
	port:settings.db_port
});
const WebSocket = require('ws');
const wsServer = new WebSocket.Server({port: settings.socket_port});

wsServer.on('connection', onConnect);



function  update_item(data,name){
	var number_item=settings.valid_symbols.indexOf(name)
	if(data.data[number_item].is_valid==true){
		influx.query(
			`SELECT mean("price") AS "meanvalue" FROM "mycurrency" WHERE "symbol"='`+name+`'  GROUP BY time(3h)` 
		).catch(err=>{
			reject(err)
		})
		.then((results) => {
			console.log('count',results.length);
		});
	}
}


function user_time(input_date){
	var date = new Date(input_date);
	Year=date.getFullYear(input_date);
	Month=date.getMonth(input_date)+1;
	if(Month<10){
		Month="0" + Month;
	}
	Day=date.getDate(input_date);
	Day=date.getDate();
	if(Day<10){
		Day="0" + Day;
	}
	Hour = date.getHours(input_date);
	if(Hour<10){
		Hour="0" + Hour;
	}
	Minutes = date.getMinutes(input_date);
	if(Minutes<10){
		Minutes="0" + Minutes;
	}
	Seconds = date.getSeconds(input_date);
	if(Seconds<10){
		Seconds="0" + Seconds;
	}
	textstring=Day+'.'+Month+'.'+Year+' '+Hour+':'+Minutes+':'+Seconds;
	return textstring;
}


function intervalFunc(wsClient) {  
	
	var data_items=new Array();  
	for(let i=0;i<settings.valid_symbols.length;i++){
		//собираем массивчик на каждую найденную валюту 
		data_items.push({
			'number':i,								//номер элемента в настройках (отладочное)
			'name':settings.valid_symbols[i],		//название
			'start':new Object({
				'time':'',
				'mean':0,
			}),
			'finish':new Object({
				'time':'',
				'mean':0,
			}),
			'points':new Array(),					//массив точек из БД
			'test':new Object({}),
		});
	}
	var current_date = new Date();//смотрим на текущее время сервера
	var data = new Object({
		'current_time':user_time(current_date),
		'server_groupe_time': settings.server_groupe_time,
		'data': data_items,	
	});
	//собираем последние значения
	influx.query(
		`SELECT * FROM "mycurrency" GROUP BY * ORDER BY DESC LIMIT 1` 
	).catch(err=>{
		console.log(err);
	}).then((results) => {
		//вставили значения current
		for(let i=0;i<settings.valid_symbols.length;i++){
			data.data[i].current_price=0;
			data.data[i].is_valid=false;
			for(let j=0;j<results.length;j++){
				if(settings.valid_symbols[i]==results[j].symbol){
					data.data[i].current_price=results[j].price;
					data.data[i].current_time=user_time(results[j].time);
					data.data[i].is_valid=true;
				}
			}
		}
	}).then(() =>{
		//скорее всего тут можно получить значения сразу с группирование,но у меня не получилось, пребираем ручками
		influx.query(
			`select mean("price") from "mycurrency" group by time(`+settings.server_groupe_time+`),"symbol"`
		).catch(err=>{
			console.log(err)
		})
		.then((results) => {
			var max_massive = Array(settings.valid_symbols.length).fill(0);
			var min_massive = Array(settings.valid_symbols.length).fill(0);
			var number,temp_round_mean;
			for(let i=0;i<results.length;i++){
				//выясняем номер вылюты, в которое будем добавлять измерение
				number=settings.valid_symbols.indexOf(results[i].symbol);
				if(results[i].mean!=null){
					//округлим чтобы было что-то приличное
					temp_round_mean=results[i].mean.toFixed(4);
					//дабы не тащить название на клиент, пересоберем выдачу
					data.data[number].points.push(
						{
							'time':    user_time(results[i].time),
							'mean':temp_round_mean,
						}
					);
					//определем максимальный
					if(max_massive[number]<temp_round_mean){
						max_massive[number]=temp_round_mean;
					}
					//определем и минимальный элемент массива
					if(min_massive[number]==0){
						min_massive[number]=temp_round_mean;
					}else{
						if(min_massive[number]>temp_round_mean){
							min_massive[number]=temp_round_mean;
						}
					}
				}
			}
			//перебираем то что получилось
			for(let i=0;i<settings.valid_symbols.length;i++){
				if(data.data[i].is_valid==true){
					data.data[i].max_price=max_massive[i];
					data.data[i].min_price=min_massive[i];
					var points_length=data.data[i].points.length;
					//стартовая точка
					data.data[i].start.time=data.data[i].points[0].time;		
					data.data[i].start.mean=data.data[i].points[0].mean;
					//последняя точка
					data.data[i].finish.time=data.data[i].points[points_length-1].time;		
					data.data[i].finish.mean=data.data[i].points[points_length-1].mean;

					//формируем полилинию(с учетом того что  у нас полотно 1000 на 200 и отсчет ведеться сверху вниз)
					//по оси X пересчитываем относительно того что у нас произвольное кол-во точек
					//по оси Y пропорциональные значения шага
					data.data[i].polyline='';
					// а также массив квадратов-координатc
					data.data[i].rects=''
					var x=0,y;
					var step; //шаг приращения по X
					step =1000/(points_length-1);
					data.data[i].test.step=step;
					for(let j=0;j<points_length;j++){
						if(data.data[i].max_price>data.data[i].min_price){
							y=((data.data[i].points[j].mean-data.data[i].min_price)*160/(data.data[i].max_price-data.data[i].min_price))+20; //тонкий момент  -на графике мы показываем изменение относительно максимума и минимума	
							data.data[i].polyline+=x+','+y+' ';
							data.data[i].rects+='<g><title>'+data.data[i].points[j].mean+' | '+data.data[i].points[j].time+'</title><rect width="10px" height="10px" x="'+(x-5)+'px" y="'+(y-5)+'px" rx="0" fill="red"/></react></g>';
						}else{
							//на случай если цена не меняется
							data.data[i].polyline+=x+',100'+' ';
							data.data[i].rects+='<g><title>'+data.data[i].points[j].mean+' | '+data.data[i].points[j].time+'</title><rect width="10px" height="10px" x="'+(x-5)+'px" y="95px" rx="0" fill="red" data-number="'+j+'"/></react></g>'
						}
						x=x+step; 
						data.data[i].test.x=x;
					}
				}
			}
			//отправка всего счасье клиенту
			wsClient.send(JSON.stringify(data));
		})
	})	

}

function onConnect(wsClient) {
	console.log('Новый пользователь');
	intervalFunc(wsClient);
	var myTimer = setInterval(intervalFunc, settings.socket_delay,wsClient);

	//закрытие соеденения
	wsClient.on('close', function() {
		console.log('Пользователь отключился');
	});
}                                           



