const myWs = new WebSocket('ws://92.255.78.131:8099');
var app = new Vue({
    el: '#app',
    data: {
		currency_items: new Array(),
		is_connected:false,
		current_time: '',
		server_groupe_time:'',
	},
	methods:{
		read_data: function() {
			//app.is_connected=false;
			myWs.onopen = function () {
				console.log('connect');
			};
			// обработчик сообщений от сервера
			myWs.onmessage = function (message) {
				//ставим коннект только когда что-то получили,а не когда только законнектились
				app.is_connected=true;
				var message_data=JSON.parse(message.data);
				console.log('Время сервера: ' + message_data.current_time);
				console.log('Данные:',message_data);
				app.currency_items		=message_data.data;
				app.current_time		=message_data.current_time;
				app.server_groupe_time	=message_data.server_groupe_time;
			};
			
			myWs.onclose = function(event) {
				if (event.wasClean) {
					console.log('Соединение закрыто чисто');
				} else {
					console.log('Обрыв соединения'); // например, "убит" процесс сервера
				}
				//здесь нужно прописать переподключение, но мы предполагаем что у нас сервак никогда не падает:)	
			};
			
			myWs.onerror = function(error) {
			   app.is_connected=false;
			   app.read_data();
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

