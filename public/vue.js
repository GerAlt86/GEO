const url = 'ws://92.255.78.131:8099';
var app = new Vue({
    el: '#app',
    data: {
		currency_items: new Array(),
		is_connected:false,			//индикатор коннекта
		is_get_data:false,			//индикатор получения данных	
		current_time: '',
		server_groupe_time:'',
	},
	methods:{
		read_data: function() {
			console.log('read_data_start');
			myWs = new WebSocket(url);
			myWs.onopen = function () {
				console.log('connect');
				 app.is_connected=true;
			};
			// обработчик сообщений от сервера
			myWs.onmessage = function (message) {
				//ставим коннект только когда что-то получили,а не когда только законнектились
				var message_data=JSON.parse(message.data);
				console.log('Время сервера: ' + message_data.current_time);
				console.log('Данные:',message_data);
				app.currency_items		=message_data.data;
				app.current_time		=message_data.current_time;
				app.server_groupe_time	=message_data.server_groupe_time;
				app.is_get_data=true;
				
				//в теории тут надо еще проставить таймер на неприятие данных -неприняли данные(Но при существующем конекте), разрываем коннект, но это под вопросом
			};
			
			myWs.onclose = function(event) {
				if (event.wasClean) {
					console.log('Соединение закрыто чисто');
				} else {
					console.log('Обрыв соединения'); // например, "убит" процесс сервера
				}
				app.is_connected=false;
			    app.is_get_data=false;
				myWs.close();
				myWs = null;
				 //переподключаемся
			    setTimeout(() => app.read_data(), 2000);
			};
			
			myWs.onerror = function(error) {
			   console.log('Ошибка соеденения');
			   //анализ ошибок?
			};
		},
		draw_reacts: function(reacts){
			return reacts;
		},
	},
	 beforeMount(){
		this.read_data()
	 },
})

