exports.app =
{
	run:(data)=>
	{
		data.o =
		{
			error: false,
			message: 'App running!!'
		};
		data.callback(data.o);
	}
}
