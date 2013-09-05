/*
 *  Ex Table Filter 0.3 - jQuery Plugin
 *  written by Cyokodog
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
		$.each(filters, function(index){
			c._filters[index] = filters[index];
		});
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
				c._row = c._rows.eq(rowno).show();
				c._show = true;
				c._cols = c._row.find('> *');
				c._cols.each(function(colno){
					c._col = c._cols.eq(colno);
					var filter = c._currentFilter = c._filters[colno];
					if(filter != undefined){
						if(!o._filtering(filter)){
							c._show = false;
						}
					}
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
	}
	});

	// Setting
	$.extend($.ex.tableFilter,{
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
		}
	},
	version : '0.2',
	id : 'ex-table-filter'
	});

	// jQuery Method
	$.fn.exTableFilter = function(option){
	var targets = this,api = [];
	if(option instanceof Array) option = {filters : option};
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

