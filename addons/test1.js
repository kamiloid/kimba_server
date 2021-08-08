exports.test1 =
{
	test1:(data)=>
	{
		data.o = {
			error: false,
			msg: 'rewgergwer'
		};
		return new Promise((resolve, reject)=>
		{
			if(0)
				data.o = {error: true, msg: 'Error in save_trips'};
				
			resolve(data.o);
		});
	}
}