/*
 *  Ex Table Filter 0.5 - jQuery Plugin
 *	written by cyokodog
 *
 *	Copyright (c) 2014 cyokodog 
 *		http://www.cyokodog.net/
 *		http://d.hatena.ne.jp/cyokodog/)
 *		http://cyokodog.tumblr.com/
 *	MIT LICENCE
 *
 *	Built for jQuery library
 *	http://jquery.com
 *
 */
;(function($){
	var f = $.regexp = function(option){
	if(!(this instanceof f)) return new f(option);
	var o = this,c = o.config = $.extend({},f.defaults,option);
	};
	$.extend(f,$.extend(f.prototype,{
	_getInstance : function(target){
		return target instanceof f ? target : f()
	},
	escapeSource : function(source){
		var o = f._getInstance(this),c = o.config;
		$.each(c.esc_str.split(','),function(){
			var esc_s = '\\' + this;
			source = source.replace(new RegExp(esc_s,'g'),esc_s);
		});
		return source;
	},
	wildcardMatchEscapeSource : function(source){
		var o = f._getInstance(this), c = o.config;
		return o.escapeSource(source).replace(/\\\*/g,'.*');
	}
	}));
	f.defaults = {
		esc_str : '\\,^,$,*,+,?,.,(,),|,{,},[,]'
	};
})(jQuery);

;(function($){

	// Namespace
	$.ex = $.ex || {};

	// Constructor
	var plugin = $.ex.tableFilter = function(target, option){
		var o = this,
		c = o.config = $.extend(true,{}, $.ex.tableFilter.defaults, option, o.getDataParam());
		plugin.status.applyCnt ++;
		c.target = target.eq(0);
		c._filters = {};
		o.setFilters(c.filters,{autoFilter:false});
		!c.autoFilter || o.filtering();
		c.callback.apply(o,[o]);
	}

	// API
	$.extend($.ex.tableFilter.prototype, {

		// プラグイン適用要素の独自データ属性(data-ex-table-filter)を取得する
		getDataParam : function(){
			try{eval('return ' + this.config.target.attr('data-' + plugin.id));}catch(e){return {};}
		},

		// プラグイン適用要素を取得する
		getTarget : function(){
			return this.config.target;
		},

		// フィルタリング中のフィルタを取得する
		getCurrentFilter : function(){
			return this.config._currentFilter;
		},

		// フィルタリング中のフィルタの値を取得する
		getCurrentFilterVal : function(){
			var o = this, c = o.config;
			var el = o.getCurrentFilter().element;
			if(!el) return undefined;
			if(/^radio|checkbox$/.test(el.prop('type'))){
				var el = el.filter(':checked');
				if(el.prop('type') == 'checkbox'){
					var ret = [];
					el.each(function(){
						ret.push($(this).val());
					});
					return ret;
				}
			}
			return el.val();
		},

		// フィルタリング中のフィルタの値を数値変換して取得する
		getCurrentFilterNum : function(){
			var o = this, c = o.config;
			return o.getCurrentFilterVal.apply(o,arguments) - 0;
		},

		// フィルタリング中の TR 要素を取得する
		getCurrentRow : function(){
			return this.config._row;
		},

		// フィルタリング中の TH/TD 要素を取得する
		getCurrentCell : function(index){
			var o = this, c = o.config;
			if(!arguments.length) return c._col;
			return o.getCurrentRow().find('> *').eq(index);
		},

		// フィルタリング中の TH/TD 要素の値を取得する
		getCurrentCellVal : function(index){
			var o = this, c = o.config;
			return o.getCurrentCell.apply(o,arguments).text();
		},

		// フィルタリング中の TH/TD 要素の値を数値変換して取得する
		getCurrentCellNum : function(index){
			var o = this, c = o.config;
			return o.getCurrentCellVal.apply(o,arguments) - 0;
		},

		// フィルタリング中の行の表示状態を取得する
		isShowCurrentRow : function(){
			return this.config._show;
		},

		// 各カラムのフィルタ条件を配列又は JSON 形式でまとめて設定する
		setFilters : function(filters, config){
			var o = this, c = $.extend({},o.config,config);
			var appends = null;
			$.each(filters, function(index){
				var filter = c._filters[index] = filters[index];
			});
			o._generateFilter();
			$.each(c._filters, function(index){
				o.setFilter(index, c._filters[index], config);
			});
			return o;
		},

		// 特定のカラムのフィルタ条件を設定する
		setFilter : function(index, filter, config){
			var o = this, c = $.extend({},o.config,config);
			if(filter instanceof RegExp){
			}
			else
			if(filter instanceof Function){
			}
			else{
				var element;
				var getDefaultParam = function(element){
					return /^radio|checkbox$/.test(element.prop('type')) ||
						element.prop('tagName') == 'SELECT' ? 
							c.selectElementFilter : 
							c.elementFilter;
				}
				if(!(filter instanceof jQuery) && typeof filter == 'object'){
					if(filter.element) {
						element = $(filter.element);
						filter = $.extend({},getDefaultParam(element),filter);
					}
				}
				else{
					element = $(filter);
					filter = $.extend({},getDefaultParam(element));
				}
				if(element) {
					filter.element = element;
					if(c.autoBindFilter){
						filter.element.on(c.elementAutoBindTrigger,function(){
							if(c._triggerTimer) clearTimeout(c._triggerTimer);
							c._triggerTimer = setTimeout(function(){
								o.filtering();
							},c.elementAutoBindFilterDelay);
						});
					}
				}
			}
			c._filters[index] = filter;
			if(c.autoFilter) o.filtering();
			return o;
		},


		// フィルタリングを実行する
		filtering : function(){
			var o = this, c = o.config;
			c._rows = c.target.find('> tbody > tr');
			c.onFilteringStart.apply(o,[o]);
			c._rows.each(function(rowno){
				if(rowno >= c.startDataRowNo){
					$.each(c._filters, function(index){
						o._setFilterStatus(c._filters[index], '_show', false);
					});
					c._row = c._rows.eq(rowno).show();
					c._show = true;
					c._cols = c._row.find('> *');
					c._cols.each(function(colno){
						c._col = c._cols.eq(colno);
						var filter = c._currentFilter = c._filters[colno];
						if(filter != undefined){
							o._setFilterStatus(filter, '_show', o._getFilterStatus(filter, '_show') || !!o._filtering(filter));
						}
					});
					$.each(c._filters, function(index){
						if(!o._getFilterStatus(c._filters[index], '_show')) c._show = false;
					});
					var ret = c.onFiltering.apply(o,[o]);
					if(ret != undefined){
						c._show = !!ret;
					}
					if(!c._show){
						c._row.hide();
					}
				}
			});
			c.onFilteringEnd.apply(o,[o]);
			return o;
		},

		// フィルタリングのメイン処理
		_filtering : function(filter){
			var o = this, c = o.config;
			var result = true;
			if(typeof filter == 'boolean') {
				result = filter;
			}
			else
			if(filter instanceof Function){
				var ret = filter.apply(o,[o]);
				if(ret != undefined) {
					result = o._filtering(ret);
				}
			}
			else
			if(filter instanceof RegExp){
				if(!filter.test(o.getCurrentCellVal())){
					result = false;
				}
			}
			else
			if(filter.queryStringMatch && filter.queryStringName){
				var getQSvalue = function(loc){
					var loc = loc || location;
					var q = loc.search.replace('?','').split('&');
					var ret = '';
					for(var i in q){
						var p = q[i].split('=');
						if(p[0] == filter.queryStringName) ret = p[1];
					}
					return ret;
				}
				var qs = getQSvalue();
				if(filter.element){
					$(filter.element).each(function(){
						if(getQSvalue(this) == qs) $(this).addClass('active')
					});
				}
				result = (!qs.length || o.getCurrentCellVal() == qs);
			}
			else
			if(filter.element && filter.element instanceof jQuery){
				var ret = filter.onFiltering.apply(o,[o]);
				if(ret != undefined) {
					result = o._filtering(ret);
				}
				else{
					var v;
					if(filter.element.prop('tagName') == 'SELECT'){
						v = filter.element.find('option:selected')[filter.selectValueMatch ? 'val' : 'text']();
					}
					else
					if(filter.element.prop('type') == 'radio'){
						v = filter.element.filter(':checked').val();
					}
					else
					if(filter.element.prop('type') == 'checkbox'){
						v = [];
						filter.element.filter(':checked').each(function(){
							v.push($(this).val());
						});
						if(!v.length) v = '';
					}
					else{
						v = filter.element.val();
					}
					if(v){
						if(v instanceof Array){
							for(var i = 0;i < v.length; i++){
								v[i] = o._makeFilterSrc(filter,v[i]);
							}
							v = v.join('|');
						}
						else{
							v = o._makeFilterSrc(filter,v);
						}
						var reg = filter.matchSwitch ?
							new RegExp(v,filter.matchSwitch) : new RegExp(v);
						result = reg.test(o.getCurrentCellVal());
					}
				}
			}
			else{
				result = !!filter;
			}
			return result;
		},

		// パラメータに従ったフィルタ条件を正規表現形式で生成
		_makeFilterSrc : function(filter,src){
			src = filter.wildcardMatch ?
				$.regexp.wildcardMatchEscapeSource(src) :
				$.regexp.escapeSource(src);
			if(filter.firstMatch || filter.wildcardMatch || filter.fullMatch) src = '^' + src;
			if(filter.lastMatch || filter.wildcardMatch || filter.fullMatch) src = src + '$';
			return src;
		},

		// フィルターにステータスを設定
		_setFilterStatus : function(filter, name, val){
			var element = filter.element;
			if(element && element.length){
				element.data(name, val);
			}
			filter[name] = val;
		},

		// フィルターのステータスを取得
		_getFilterStatus : function(filter, name){
			var element = filter.element;
			if(element && element.length){
				return element.data(name);
			}
			return filter[name];
		},

		// フィルタ入力フィールドを自動生成する
		_generateFilter : function(){
			var o = this, c = o.config;
			var appends = null;
			$.each(c._filters, function(index){
				var filter = c._filters[index];
				if(!(filter instanceof jQuery) && typeof filter == 'object'){
					var append = filter.append;
					if(append && append.to && append.type){
						appends = appends || {};
						appends[index] = append;
					}
				}
			});
			if(!appends) return o;
			c.target.find('> tbody > tr').each(function(rowno){
				var tr = $(this);
				if(rowno >= c.startDataRowNo){
					$.each(appends, function(i){
						var v = tr.find('> *').eq(i).text();
						if(v.length){
							var append = appends[i];
							append.values = append.values || {};
							append.values[v] = v;
							if(!isNaN(v)) append.numCnt = (append.numCnt || 0) + 1;
							append.valCnt = (append.valCnt || 0) + 1;
						}
					});
				}
			});
			$.each(appends, function(i){
				var append = appends[i];
				var appendFilter = c.appendFilter[append.type];
				append = $.extend(true, {}, appendFilter, append);
				append.to = $(append.to);
				append.isNumValues = (append.numCnt == append.valCnt);
				if(append.to.length && append.values){
					var arr = [];
					$.each(append.values, function(v){
						arr.push(v);
					});
					!append.isNumValues ? arr.sort() : arr.sort(function(a, b){
						return (parseInt(a) > parseInt(b)) ? 1 : -1;
					});
					if(/^(checkbox|radio)$/.test(append.type)){
						var element = [];
						var add = function(label, value){
							var wrap = $(append.template.replace(/{label}/ig, label)).appendTo(append.to);
							var el = wrap.prop('type') == append.type ? wrap : wrap.find('input:' + append.type);
							if(append.type == 'radio') el.prop('name', 'radio-filter-' + plugin.status.applyCnt);
							element.push(el.val(value)[0]);
						}
						$.each(arr, function(j){
							var v = arr[j];
							if(j == 0 && append.addBlank) add(append.blankLabel, append.blankValue)
							add(v, v);
						});
						if(element.length){
							c._filters[i].element = $(element);
						}
					}
					else
					if(append.type == 'select'){
						var element = $(append.template).appendTo(append.to);
						var add = function(label, value) {
							$('<option/>').val(value).text(label).appendTo(element);
						}
						if(append.addBlank) add(append.blankLabel, append.blankValue);
						$.each(arr, function(j){
							var v = arr[j];
							add(v, v);
						});
						c._filters[i].element = element;
					}
					else
					if(append.type == 'text'){
						c._filters[i].element = $(append.template).appendTo(append.to);
					}
				}
			});
		}
	});

	// Setting
	$.extend($.ex.tableFilter,{
		status : {
			applyCnt : 0
		},
		defaults : {
			api : false,	// true の場合 api オブジェクトを返す
			filters : [],	// 各カラムのフィルタ条件を配列又は JSON 形式でまとめて指定
			autoFilter : true,	//	プラグイン適用後のフィルタリングの自動実行の適用
			autoBindFilter : true,	//	トリガーの自動割り当ての適用
			elementAutoBindTrigger : 'keydown change',	//	自動割り当てするトリガーの指定
			elementAutoBindFilterDelay : 300,	//	フィルタトリガー起動時のフィルタリング実行間隔の指定
			startDataRowNo : 0,	//	フィルタリング開始行の指定
			callback : function(api){},	//	プラグイン適用後のコールバック処理の指定
			onFilteringStart : function(api){},	//	フィルタリング開始時のコールバック処理の指定
			onFiltering : function(api){},	//	各行のフィルタリング後のコールバック処理の指定
			onFilteringEnd : function(api){},	//	フィルタリング終了時のコールバック処理の指定
			elementFilter : {	//	input:text 要素でフィルタする場合のデフォルト設定
				element : '',	//	フィルタ条件の入力フィールドを指定
				firstMatch : false,	//	前方一致フィルタの適用
				lastMatch : false,	//	後方一致フィルタの適用
				fullMatch : false,	//	完全一致フィルタの適用
				wildcardMatch : false,	//	ワイルドカードフィルタの適用
				matchSwitch : 'ig',	// 正規表現フィルタのスイッチを指定
				queryStringMatch : false, // QueryString の値でフィルタリング
				queryStringName : '', // queryStringMatch が true 時に照合するパラメータ名を指定
				onFiltering : function(api){}
			},
			selectElementFilter : {	//	select,radio,checkbox 要素でフィルタする場合のデフォルト設定
				selectValueMatch : false,	//	select 要素でフィルタする場合の value 属性で一致判定する
				element : '',	//	elementFilterと同様
				firstMatch : false,	//	elementFilterと同様
				lastMatch : false,	//	elementFilterと同様
				fullMatch : true,	//	完全一致フィルタの適用
				wildcardMatch : false,	//	elementFilterと同様
				matchSwitch : '',	//	elementFilterと同様
				onFiltering : function(api){}
			},
			appendFilter : {
				to : '',
				type : '',
				'text' : {
					template : '<input class="form-control" type="text"/>'
				},
				'checkbox' : {
					template : '<div class="checkbox"><label><input type="checkbox"/>{label}</label></div>'
				},
				'radio' : {
					addBlank : true,
					blankLabel : 'all',
					blankValue : '',
					template : '<div class="radio"><label><input type="radio""/>{label}</label></div>'
				},
				'select' : {
					addBlank : true,
					blankLabel : '',
					blankValue : '',
					template : '<select class="form-control"/>'
				}
			},
			filterFieldTemplate : '<div><label>FILTER:</label><input type="text" class="form-control"/></div>'
		},
		version : '0.5',
		id : 'ex-table-filter'
	});

	// jQuery Method
	$.fn.exTableFilter = function(option, option2){
		var targets = this, api = [];
		var makeFilter = function(option){
			option = $.extend({}, plugin.defaults, option);
			return $(option.filterFieldTemplate).insertBefore(targets.eq(0)).find('input');
		}
		var makeFilters = function(filter, option){
			filter = filter || makeFilter(option);
			option = option || {};
			var arr = [];
			targets.eq(0).find('> tbody > tr:eq(0) > *').each(function(i){
				var sts = true
				if(option.ignore){
					var ignore = option.ignore.split(',');
					$.each(ignore, function(j){
						if(i == ignore[j]) sts = false;
					});
				}
				if(sts) arr[i] = filter;
			});
			if(!arr.length) return option;
			return $.extend(option, {filters : arr});
		}
		if(!arguments.length){
			option = makeFilters();
		}
		else{
			if(option instanceof Array){
				option = $.extend({}, (option2 || {}), {filters : option});
			}
			else
			if(option instanceof jQuery || typeof option == 'string'){
				option = makeFilters(option, option2);
			}
			else
			if(typeof option == 'object'){
				if(!option.filters){
					option = makeFilters(null, option);
				}
			}
		}
		targets.each(function(index) {
			var target = targets.eq(index);
			var obj = target.data(plugin.id) ||
				new $.ex.tableFilter(target, $.extend({}, option, {'targets': targets, 'index': index}));
			api.push(obj);
			target.data(plugin.id, obj);
		});
		return option && option.api ? ($.ex.api ? $.ex.api(api) : api.length > 1 ? api : api[0]) : targets;
	}

})(jQuery);

