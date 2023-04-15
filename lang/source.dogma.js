/** @type {import('../lib/index.js').Grammar} */
const grammar = {
	"$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
	"names": ['dogma'],
    "extensions": ['.dogma'],
    "firstLineMatch": "dogma_v1 [a-zA-Z][a-zA-Z0-9_.+:()-]+",
	"scopeName": "source.dogma",
	"patterns": [
		{"include": "#identifier_line"},
		{"include": "#header"},
		{"include": "#function_noargs_rule"},
		{"include": "#symbol_rule"},
		{"include": "#function_args_rule"},
		{"include": "#macro_rule"},
		{"include": "#line_comment"}
	],
	"repository": {
		"identifier_line": {
			"patterns": [
				{
					"begin": "^(dogma_v1)\\s+",
					"beginCaptures": {
						"1": {
							"name": "entity.name.signature.dogma"
						}
					},
					"end": "(?!\\G)",
					"patterns": [
						{
							"match": "[a-zA-Z][a-zA-Z0-9_.+:()-]+",
							"name": "entity.name.charset.dogma"
						}
					]
				}
			]
		},
		"header": {
			"match": "^-\\s+(\\w+)\\s*=(.*)$",
			"captures": {
				"1": {
					"name": "variable.other.header-name.dogma"
				},
				"2": {
					"name": "entity.name.header-value.dogma"
				}
			}
		},
		"symbol_rule": {
			"begin": "([[:alpha:]][[:alnum:]_]*)\\s*(=)\\s*",
			"beginCaptures": {
				"1": {"name": "entity.name.function.symbol.dogma"},
				"2": {"name": "punctuation.separator.dogma"}
			},
			"end": "\\s*(;)",
			"endCaptures": {
				"1": {"name": "punctuation.terminator.dogma"}
			},
			"name": "entity.name.rule.dogma",
			"patterns": [
				{"include": "#prose"},
				{"include": "#expression"}
			]
		},
		"macro_rule": {
			"begin": "([[:alpha:]][[:alnum:]_]*)(\\()\\s*([[:alpha:]][[:alnum:]_]*)(?:\\s*(,)\\s*([[:alpha:]][[:alnum:]_]*))*\\s*(\\))\\s*(=)\\s*",
			"beginCaptures": {
				"1": {"name": "entity.name.function.macro.dogma"},
				"2": {"name": "punctuation.definition.parameters.begin.bracket.round.dogma"},
				"3": {"name": "meta.definition.variable.dogma"},
				"4": {"name": "punctuation.separator.dogma"},
				"5": {"name": "meta.definition.variable.dogma"},
				"6": {"name": "punctuation.definition.parameters.end.bracket.round.dogma"},
				"7": {"name": "punctuation.separator.dogma"}
			},
			"end": "\\s*(;)",
			"endCaptures": {
				"1": {"name": "punctuation.terminator.dogma"}
			},
			"name": "entity.name.rule.dogma",
			"patterns": [
				{"include": "#expression"}
			]
		},
		"function_noargs_rule": {
			"begin": "([[:alpha:]][[:alnum:]_]*)\\s*(:)\\s*([[:alpha:]][[:alnum:]_]*)\\s*(=)\\s*",
			"beginCaptures": {
				"1": {"name": "entity.name.function.dogma"},
				"2": {"name": "punctuation.separator.dogma"},
				"3": {"name": "storage.type.dogma"},
				"4": {"name": "punctuation.separator.dogma"}
			},
			"end": "\\s*(;)",
			"endCaptures": {
				"1": {"name": "punctuation.terminator.dogma"}
			},
			"name": "entity.name.rule.dogma",
			"patterns": [
				{"include": "#prose"}
			]
		},
		"function_args_rule": {
			"begin": "([[:alpha:]][[:alnum:]_]*)\\s*(\\()\\s*([[:alpha:]][[:alnum:]_]*)\\s*(:)\\s*([[:alpha:]][[:alnum:]_]*)(?:\\s*(,)\\s*([[:alpha:]][[:alnum:]_]*)\\s*(:)\\s*([[:alpha:]][[:alnum:]_]*))*(\\.\\.\\.)?\\s*(\\))\\s*(:)\\s*([[:alpha:]][[:alnum:]_]*)\\s*(=)\\s*",
			"beginCaptures": {
				"1": {"name": "entity.name.function.macro.dogma"},
				"2": {"name": "punctuation.definition.parameters.begin.bracket.round.dogma"},
				"3": {"name": "meta.definition.variable.dogma"},
				"4": {"name": "punctuation.separator.dogma"},
				"5": {"name": "storage.type.dogma"},
				"6": {"name": "punctuation.separator.dogma"},
				"7": {"name": "meta.definition.variable.dogma"},
				"8": {"name": "punctuation.separator.dogma"},
				"9": {"name": "storage.type.dogma"},
				"10": {"name": "punctuation.vararg-ellipses.dogma"},
				"11": {"name": "punctuation.definition.parameters.end.bracket.round.dogma"},
				"12": {"name": "punctuation.separator.dogma"},
				"13": {"name": "storage.type.dogma"},
				"14": {"name": "punctuation.separator.dogma"}
			},
			"end": "\\s*(;)",
			"endCaptures": {
				"1": {"name": "punctuation.terminator.dogma"}
			},
			"name": "entity.name.rule.dogma",
			"patterns": [
				{"include": "#prose"}
			]
		},
		"call": {
			"begin": "([[:alpha:]][[:alnum:]_]*)\\s*(\\()",
			"beginCaptures": {
				"1": {
					"name": "entity.name.function.dogma"
				},
				"2": {
					"name": "punctuation.definition.parameters.begin.bracket.round.dogma"
				}
			},
			"end": "\\)",
			"endCaptures": {
				"0": {
					"name": "punctuation.definition.parameters.end.bracket.round.dogma"
				}
			},
			"name": "meta.function-call.dogma",
			"patterns": [
				{
					"match": "(,)",
					"name": "punctuation.separator.arguments.dogma"
				},
				{"include": "#expression"}
			]
		},
		"variable": {
			"match": "([[:alpha:]][[:alnum:]_]*)\\b(?!\\()",
			"name": "variable.parameter.dogma"
		},
		"expression": {
			"patterns": [
				{"include": "#operands"},
				{"include": "#operators"},
				{"include": "#call"},
				{"include": "#variable"},
				{"include": "#switch"},
				{"include": "#line_comment"}
			]
		},
		"operands": {
			"patterns": [
				{"include": "#variable"},
				{"include": "#integer"},
				{"include": "#float"},
				{"include": "#float_x"},
				{"include": "#string_squote"},
				{"include": "#string_dquote"}
			]
		},
		"switch": {
			"begin": "\\[",
			"beginCaptures": {
				"0": {"name": "entity.name.switch.start.dogma"}
			},
			"end": "\\]",
			"endCaptures": {
				"0": {"name": "entity.name.switch.end.dogma"}
			},
			"name": "entity.name.switch.dogma",
			"patterns": [
				{"include": "#switch_default_expression"},
				{"include": "#switch_branch_condition"},
				{"include": "#switch_branch_expression"},
				{"include": "#line_comment"}
			]
		},
		"switch_branch_condition": {
			"begin": "(?<=[\\[;]\\s*)(?!\\s*\\])",
			"end": "(:)|(?=\\])",
			"endCaptures": {
				"1": {"name": "punctuation.separator.dogma"}
			},
			"name": "entity.name.switch.condition.dogma",
			"patterns": [
				{"include": "#operands"},
				{"include": "#operators"},
				{"include": "#line_comment"}
			]
		},
		"switch_branch_expression": {
			"begin": "(?<=:\\s*)",
			"end": ";",
			"endCaptures": {
				"0": {"name": "punctuation.separator.dogma"}
			},
			"name": "entity.name.switch.expression.dogma",
			"patterns": [
				{"include": "#expression"}
			]
		},
		"switch_default_expression": {
			"begin": "(:)\\s*",
			"beginCaptures": {
				"1": {"name": "punctuation.separator.dogma"}
			},
			"end": ";",
			"endCaptures": {
				"0": {"name": "punctuation.separator.dogma"}
			},
			"name": "entity.name.switch.expression.dogma",
			"patterns": [
				{"include": "#expression"}
			]
		},
        "integer": {
            "match": "(?x)(?i) (?:-|\\b) (?: 0[xX][0-9a-f_]* | 0[oO][0-7_]* | 0[bB][01_]* | [0-9_]+ ) (?!-) \\b",
            "name": "constant.numeric.dogma"
        },
        "float": {
            "match": "(?x)(?i) (?:-|\\b) (?: [0-9_]+\\.[0-9_]+(e[+-]?[0-9_]+)? | [0-9_]+(e[+-]?[0-9_]+)? | 0x[0-9a-f_]+\\.[0-9a-f_]+(p[+-]?[0-9_]+)? | 0x[0-9a-f_]+(p[+-]?[0-9_]+)? ) (?!-) \\b",
            "name": "constant.numeric.dogma"
        },
        "float_x": {
            "match": "(?x)(?i) (?:-|\\b) 0[xX](?: [0-9a-f_]+\\.[0-9a-f_]+(p[+-]?[0-9_]+)? | [0-9a-f_]+(p[+-]?[0-9_]+)? ) (?!-) \\b",
            "name": "constant.numeric.dogma"
        },
        "string_squote": {
            "begin": "'",
            "beginCaptures": {
                "0": {"name": "punctuation.definition.string.begin.dogma"}
            },
            "end": "'",
            "endCaptures": {
                "0": {"name": "punctuation.definition.string.end.dogma"}
            },
            "name": "string.quoted.single.dogma",
            "patterns": [
                {"include": "#string_content"}
            ]
        },
        "string_dquote": {
            "begin": "\"",
            "beginCaptures": {
                "0": {"name": "punctuation.definition.string.begin.dogma"}
            },
            "end": "\"",
            "endCaptures": {
                "0": {"name": "punctuation.definition.string.end.dogma"}
            },
            "name": "string.quoted.double.dogma",
            "patterns": [
                {"include": "#string_content"}
            ]
        },
        "prose": {
            "begin": "\"\"\"",
            "beginCaptures": {
                "0": {"name": "punctuation.definition.prose.begin.dogma"}
            },
            "end": "\"\"\"",
            "endCaptures": {
                "0": {"name": "punctuation.definition.prose.end.dogma"}
            },
            "name": "string.prose.dogma",
            "patterns": [
                {"include": "#string_content"}
            ]
        },
        "string_content": {
            "patterns": [
                {
                    "match": "\\\\[\\\"\\\\]",
                    "name": "constant.character.escape.dogma"
                },
                {
                    "match": "\\\\[[0-9a-fA-F]+]",
                    "name": "constant.character.unicode.dogma"
                },
                {
                    "match": "\\\\.",
                    "name": "invalid.illegal.unrecognized-string-escape.dogma"
                }
            ]
        },
		"operators": {
			"patterns": [
				{
					"match": "(=|!=|<=|>=)",
					"name": "keyword.operator.comparison.dogma"
				},
				{
					"match": "(&|\\||!)",
					"name": "keyword.operator.logical.dogma"
				},
				{
					"match": "(\\+|\\-|\\*|/|%)",
					"name": "keyword.operator.arithmetic.dogma"
				},
				{
					"match": "(~)",
					"name": "keyword.operator.range.dogma"
				}
			]
		},
		"line_comment": {
			"patterns": [
				{
					"begin": "(^[ \\t]+)?(?=#)",
					"beginCaptures": {
						"1": {
							"name": "punctuation.whitespace.comment.leading.dogma"
						}
					},
					"end": "(?!\\G)",
					"patterns": [
						{
							"begin": "#",
							"beginCaptures": {
								"0": {
									"name": "punctuation.definition.comment.dogma"
								}
							},
							"end": "\\n",
							"name": "comment.line.number-sign.dogma"
						}
					]
				}
			]
		}
	}
}

export default grammar
