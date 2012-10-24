var moment = require('moment');

var future = moment().add('days', 7); // 1 week

console.log( future.format("DDD !!! dddd, MMMM D YYYY, h:mm:ss a") );
