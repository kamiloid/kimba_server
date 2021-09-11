const { S3Client } = require("@aws-sdk/client-s3");
const {tools} = require('./tools.js');

exports.s3 = 
{
	_conn: null,
	_region: 'us-east-2',
	_bucket: 'kimba-app',
	connect:function()
	{
		this._conn = new S3Client(this._region);
		tools.log(this._conn.send);
	}
}