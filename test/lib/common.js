fs = require('fs')
async = require('async')
assert = require('assert')
yaml = require('js-yaml')
$rangeTable = $tableName = 'table_hash_string_range_number'
$hashTable = 'test_hash'

var dynalite = require('dynalite'),
dynaliteServer = dynalite({ createTableMs: 50,db: require('memdown')})
dynaliteServer.listen(4567, function(err) {
	if (err) throw err
})

var AWS = require('aws-sdk')
DynamoSQL = require('../../lib/dynamodb')( new AWS.DynamoDB({endpoint: 'http://localhost:4567', "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" }))
DynamoDB  = require('@awspilot/dynamodb')( new AWS.DynamoDB({endpoint: 'http://localhost:4567', "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" }))








query_handler = function( idx, yml ) {
	return function(done) {
		if (yml.Tests.query[idx].log === true)
			global.DDBSQL = true
		else
			global.DDBSQL = false

		DynamoSQL.query( yml.Tests.query[idx].query, function(err, data ) {
			var dataItem;
			async.waterfall([
				function(cb) {
					if (! yml.Tests.query[idx].hasOwnProperty('dataItem'))
						return cb()

					var dt = DynamoDB.table(yml.Tests.query[idx].dataItem.table)
					Object.keys(yml.Tests.query[idx].dataItem.item).map(function(k) {
						dt.where(k).eq(yml.Tests.query[idx].dataItem.item[k])
					})
					dt.get(function(err, new_data ) {
						if (err)
							throw err

						dataItem = new_data
						cb()
					})
					
				},
			], function() {
				
				if (yml.Tests.query[idx].shouldFail) {
					if (err) {
						if (!(yml.Tests.query[idx].validations || []).length)
							return done()

						yml.Tests.query[idx].validations.forEach(function(el) {
							assert.deepEqual(eval( el.key ), eval( el.value ))
						})
						done()
					}
				} else {
					if (err)
						throw err

					if (yml.Tests.query[idx].log === true) {
						console.log("data=", JSON.stringify(data, null, "\t"))
						if (dataItem) console.log("dataItem=", JSON.stringify(dataItem, null, "\t"))
					}

					if (yml.Tests.query[idx].results)
						assert.equal(data.length, yml.Tests.query[idx].results)

					if (yml.Tests.query[idx].validations) {
						yml.Tests.query[idx].validations.forEach(function(el) {
							assert.deepEqual(eval( el.key ), eval( el.value ))
						})
					}
					done()
				}
			})
		})
	}
}

before_test = function(data) {
	return function(done) {
		async.each(data, function(q, cb ) {
			DynamoSQL.query(q, {}, cb )
		}, function(err) {
			if (err)
				throw err

			done()
		})
	}
}

run_test = function(test_name, yml_file ) {
	
	describe(test_name, function () {
		var yml = yaml.safeLoad(fs.readFileSync(yml_file, 'utf8'))
		before(before_test(yml.Prepare.Data))
		// beforeEach

		yml.Tests.query.forEach(function(v,k) {
			it(yml.Tests.query[k].title || yml.Tests.query[k].query, query_handler(k, yml ) )
			
		})
	})
}
