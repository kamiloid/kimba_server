var md5 = require('md5');

exports.tools = 
{
	log:(args)=>
	{
		console.error(args);
	},
	cross_domaine:(http, app_prefix)=>
	{
		http.use(`${app_prefix}/api`, function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
		  next();
		 });
	},
	http2https:(http)=>
	{
		http.use(function(req, res, next) {  
		    if (req.headers['x-forwarded-proto'] !== 'https')
		        return res.redirect('https://' + req.headers.host + req.url);
			next();
		});
	},
	protect_api:(http, app_prefix, cb=null)=>
	{
		http.get(`/${app_prefix}/*`, (req, res) => {
			if(req.url.includes(`${app_prefix}/api`))
				return res.redirect(`https://${req.headers.host}/${app_prefix}`);
			if(cb)
				cb(req, res);
		});
	},
	md5:(seed)=>
	{
		return md5(seed);
	},
	uid:function()
	{
		return this.md5((new Date()).getTime() * Math.random());
	},
	date:
	{
		now:()=>
		{
			return new Date();
		},
		time: function(d=null)
		{
			return (!d ? new Date() : d).getTime();
		},
		date_read:(d=null)=>
		{
			let now = !d ? new Date() : d;
			let month = now.getMonth() + 1;
			let date = now.getDate();

			month = month < 10 ? `0${month}` : month;
			date = date < 10 ? `0${date}` : date;
			return `${now.getFullYear()}-${month}-${date}`;
		},
		time_read:(d=null)=>
		{
			let now = !d ? new Date() : d;
			let h = now.getHours();
			let m = now.getMinutes();
			let s = now.getSeconds();

			h = h < 10 ? `0${h}` : h;
			m = m < 10 ? `0${m}` : m;
			s = s < 10 ? `0${s}` : s;

			return `${h}:${m}:${s}`;
		},
		date_time_read: function(d=null)
		{
			return `${this.date_read(d)} ${this.time_read(d)}`;
		}
	}
}