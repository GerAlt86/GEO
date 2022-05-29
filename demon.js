var settings = require('./settings');
const Influx = require('influx');
const influx= new Influx.InfluxDB({
	host: settings.db_host,
	database: settings.db_base,
	port:settings.db_port
});
var fetch = require('node-fetch');

/*
    "BNBBTC​",
    "BTCEUR​", ??? -эти валют нет.
*/

function intervalFunc() {
	fetch('https://api.binance.com/api/v3/ticker/price')
	.then(res => res.json())
	.then(function(res){
		var bd_json=new Array();
		for(let i=0;i<res.length;i++){
			for(let j=0;j<settings.valid_symbols.length;j++){
				if(res[i].symbol==settings.valid_symbols[j]){
					//console.log(res[i]);
					bd_json.push({
						measurement: 'mycurrency',
						tags: { symbol: res[i].symbol},
						fields: { price: Number(res[i].price)},
					});
				}
			}
		}
		influx.writePoints(bd_json);
		//var now = new Date().toLocaleTimeString();
		//console.log('---demon',now);
	});
}
setInterval(intervalFunc, settings.frequency);