module.exports = {
	//частота записи в бд
	frequency: 1000,
	//запрашиваемые валюты
	valid_symbols:["BNBUSDT","BNBBTC​","BTCEUR​","AXSBUSD","BUSDUSDT",],
	//БД
	db_host:'localhost',
	db_base:'testdb',
	db_port:8086,
	//данные вебсокета -порт и частота отправки
	socket_port:8099,
	socket_delay:1000,
	//время усреднения за которое производиться группирование (слишком мало -точек не будет,слишком много -утонешь в точках)
	server_groupe_time: '3h',
};