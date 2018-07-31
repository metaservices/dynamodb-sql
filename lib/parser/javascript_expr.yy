


def_resolvable_expr
	: dev_resolvable_value
		{ $$ = $1 }
	| LPAR def_resolvable_expr RPAR
		{ $$ = $2 }
	| def_resolvable_expr PLUS def_resolvable_expr
		{ $$ = $1 + $3 }
	| def_resolvable_expr MINUS def_resolvable_expr
		{ $$ = $1 - $3 }
	| def_resolvable_expr STAR def_resolvable_expr
		{ $$ = $1 * $3 }
	| def_resolvable_expr SLASH def_resolvable_expr
		{
			if ($3 === 0 )
				throw 'Division by 0';

			$$ = $1 / $3
		}
	;

dev_resolvable_value
	: javascript_data_obj_date
		{ $$ = $1 }
	| dynamodb_data_number
		{ $$ = $1 }
	| dynamodb_data_string
		{ $$ = $1 }
	;
