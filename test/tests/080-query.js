var fs = require('fs')
var yml = yaml.safeLoad(fs.readFileSync('test/res/080-query.yaml', 'utf8'));

//console.log(yml.Tests);

var query_handler = function(idx, done ) {
	return function(done) {
		if (yml.Tests.query[idx].log === true)
			global.DDBSQL = true
		else
			global.DDBSQL = false

		DynamoSQL.query(this.test.title, function(err, data ) {
			if (yml.Tests.query[idx].shouldFail) {
				if (err)
					return done()

				throw 'query expected to fail'
			} else {
				if (err)
					throw err

				if (yml.Tests.query[idx].log === true)
					console.log("result=", JSON.stringify(data, null, "\t"))

				if (yml.Tests.query[idx].results)
					assert.equal(data.length, yml.Tests.query[idx].results)

				if (yml.Tests.query[idx].validations) {
					yml.Tests.query[idx].validations.forEach(function(el) {
						assert.equal(eval( el.key ), eval( el.value ))
					})
				}
				done()
			}
		})
	}
}

describe('query', function () {

	// before(func)
	// beforeEach

	it('prepare data for query', function(done) {
		async.each(yml.Prepare.Data, function(q, cb ) {
			DynamoSQL.query(q, {}, cb )
		}, function(err) {
			if (err)
				throw err

			done()
		})
	})

	it(yml.Tests.query[0].query, query_handler(0) ) // no where, should fail ... will do scan in the future
	it(yml.Tests.query[1].query, query_handler(1) ) // hash = string
	it(yml.Tests.query[2].query, query_handler(2) ) // hash = number
	it(yml.Tests.query[3].query, query_handler(3) ) // hash = .. AND range > ..
	it(yml.Tests.query[4].query, query_handler(4) ) // hash = .. AND range = ..
	it(yml.Tests.query[5].query, query_handler(5) ) // BETWEEN number number
	it(yml.Tests.query[6].query, query_handler(6) ) // BETWEEN string string
	it(yml.Tests.query[7].query, query_handler(7) ) // LIKE
	it(yml.Tests.query[8].query, query_handler(8) ) // USE INDEX
	it(yml.Tests.query[9].query, query_handler(9) ) // LIMIT
	it(yml.Tests.query[10].query, query_handler(10) ) // DESC
	
	it(yml.Tests.query[11].query, query_handler(11) ) // SELECT field
	it(yml.Tests.query[12].query, query_handler(12) ) // SELECT field, inexistent_field
	it(yml.Tests.query[13].query, query_handler(13) ) // SELECT field , field
	it(yml.Tests.query[14].query, query_handler(14) ) // SELECT field , STAR   <- should fail
	it(yml.Tests.query[15].query, query_handler(15) ) // SELECT field AS alias <- should fail
	
	it(yml.Tests.query[16].query, query_handler(16) ) // SELECT ... CONSISTENT_READ
	//it(yml.Tests.query[17].query, query_handler(17) ) // SELECT CONSISTENT_READ ... 
	
	it(yml.Tests.query[18].query, query_handler(18) ) // SELECT ... HAVING a = b
	it(yml.Tests.query[19].query, query_handler(19) ) // SELECT ... HAVING number BETWEEN 50 AND 150
	it(yml.Tests.query[20].query, query_handler(20) ) // SELECT ... HAVING string LIKE 'text%'
	it(yml.Tests.query[21].query, query_handler(21) ) // SELECT ... HAVING boolean = true
	it(yml.Tests.query[22].query, query_handler(22) ) // SELECT ... HAVING boolean = false
	it(yml.Tests.query[23].query, query_handler(23) ) // SELECT ... HAVING field CONTAINS 'text'


	// these dont work, need to check with @awspilot/dynamodb
	//it(yml.Tests.query[24].query, query_handler(24) ) // SELECT ... HAVING array CONTAINS 'text'
	//it(yml.Tests.query[25].query, query_handler(25) ) // SELECT ... HAVING array CONTAINS number
	//it(yml.Tests.query[26].query, query_handler(26) ) // SELECT ... HAVING field CONTAINS boolean
	

})
