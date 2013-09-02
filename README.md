# jQuery Ex Table Filter

テーブル表に対し柔軟性の高いフィルタリング機能を適用できる jQuery プラグインです。

## 基本的な使い方

### js ファイルのインクルード

jquery.js と jquery.extablefilter.js を読み込みます。

  <script src="jquery.js"></script>
	<script src="jquery.extablefilter.js"></script>

### HTML

フィルタリングするテーブルを書きます。

	<table id="data">
		<thead>
			<tr>
				<th>No</th>
				<th>Class</th>
				<th>Category</th>
				<th>Qty</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>1</td>
				<td>core</td>
				<td>Ajax</td>
				<td>203</td>
			</tr>
			・・・
		</tbody>
	</table>

フィルタ条件の入力フィールドを書きます。

	Class <input id="class-filter"/>
	Category <input id="category-filter"/>

### JavaScript

テーブルに exTableFilter() メソッドを実行します。その際 filters パラメータで各カラムに対し、フィルタ条件の入力フィールドを割り当てます。フィルタリング処理はフィルタ条件が変更されたタイミングで実行されます。

	$('#data').exTableFilter({
		filters : {
			2 : '#category-filter'
		}
	});

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo01)

フィルタ条件の入力フィールドには、ラジオボタン、チェックボックス、プルダウンメニューも指定できます。

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo02)

## ロジックでフィルタリング判定する

ロジックでフィルタリング判定することができます。例えば値が一定の範囲のデータのみを表示するといったフィルタリングをする場合、以下のように書くことができます。

### HTML

	<input name="qty-filter" type="radio" value=""/>all
	<input name="qty-filter" type="radio" value="100"/>＞100
	<input name="qty-filter" type="radio" value="200"/>＞200

### JavaScript

	$('#data').exTableFilter({
		filters : {
			3 : {
				element : 'input[name=qty-filter]',
				onFiltering : function(api){
					return api.getCurrentCellNum() >= api.getCurrentFilterNum();
				}
			}
		}
	});

element パラメータでフィルタ条件入力フィールドを指定し、onFiltering コールバック関数でフィルタリングの判定処理を行い表示（true）、非表示（false）を返却値として返します。上記例では、

- api オブジェクトの getCurrentCellNum() メソッドでフィルタリング中のテーブルデータの値を数値変換し取得
- getCurrentFilterNum() メソッドで適用してるフィルタ条件の値を数値変換し取得
- 値を比較した結果を真偽値として返えす。

という処理をしてます。数値変換しない値を取得する場合は、それぞれ getCurrentCellVal()、getCurrentFilterVal() を使用します。

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo03)

## フィルタリング時に処理を割り込ませる

フィルタリング中もしくはフィルタイリングの開始終了時に、処理を割り込ませることができます。例えば表のフッターに集計行を設け、フィルタリングの都度、再集計した結果を表示するには、以下のように記述することができます。

### HTML

フッター行を追加します。

	<table id="data">
		…
		<tfoot>
			<tr>
				<th colspan="3"/>
				<th id="sum">0</th>
			</tr>
		</tfoot>
	</table>

### JavaScript

	var sum;
	$('#data').exTableFilter({
		filters : {
			…
		},
		onFilteringStart : function(api){
			sum = 0;
		},
		onFiltering : function(api){
			if(api.isShowCurrentRow()) sum = sum + api.getCurrentCellNum(3);
		},
		onFilteringEnd : function(api){
			$('#sum').html(sum);
		}
	});

以下のコールバック関数を使用し、プラグインのフィルタリング処理に集計処理を割り込ませています。

- onFilteringStart 
	- フィルタリング開始前に実行されます。集計変数の初期化をしています。
- onFiltering
	- １行フィルタリング判定する毎に実行されます。isShowCurrentRow() メソッドでカレント行が表示状態であるかを判定し、表示されてる場合のみ集計処理を行っています。getCurrentCellNum() メソッドでは参照したい列番号（例では3）を指定することで特定列の値を参照することができます。
- onFilteringEnd
	- フィルタリング終了時に実行されます。集計結果を表示してます。

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo04)

## フィルタリングの一致条件を指定する

前方一致、後方一致、完全一致、ワイルドカード一致等のフィルタリングの一致条件を指定することができます。
例えば前方一致条件を適用する場合は firstMatch パラメータに true を指定します。

	$('#data').exTableFilter({
		filters : {
			2 : {
				element : '#category-filter',
				firstMatch : true
			}
		}
	});

各フィルタ条件のパラメータは以下のようになってます。いずれも true か false を指定します。デフォルト値は全て false です。

- firstMatch
	- 前方一致フィルタ。先頭の文字列が一致するデータのみが表示対象となります。
- lastMatch
	- 後方一致フィルタ。最後の文字列が一致するデータのみが表示対象となります。
- fullMatch
	- 完全一致フィルタ。全ての文字列が一致するデータのみが表示対象となります。
- wildcardMatch
	- ワイルドカード一致フィルタ。フィルタ条件指定外の部分に * を指定する必要があります。例えば jquery.js というデータを表示さるには jquery.* のように指定します。（jquery. では表示されません)

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo05)

## 条件入力フィールドを使わずフィルタリングする

filters パラメータに条件入力フィールドを指定せず、正規表現、真偽値、関数等を指定する事ができます。

正規表現によるフィルタリングの例。「No」列に数字がセットされてる行のみを表示するには、以下のように書けます。

	$('#data').exTableFilter({
		filters : {
			0 : /^\d+$/
		}
	});

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo06)

関数によるフィルタリングの例。クエリストリングで指定されたカテゴリのデータのみを表示するには、以下のように書けます。（返却値として関数を返し、その実行結果でフィルタリング判定をさせることもできます。）

	$('#data').exTableFilter({
		filters : {
			2 : function(api){

				//クエリストリングから分類(class)の取得
				var q = location.search.split('&');
				var _class;
				for(var i in q){
					var p = q[i].split('=');
					if(p[0] == 'class') _class = p[1];
				}

				//分類(class)と一致してた場合は true を返す
				return (!_class || api.getCurrentCellVal() == _class);
			}
		}
	});

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo07)

## select > option 要素の value 属性でフィルタリングする

select 要素を条件入力フィールドとした場合、選択された option 要素の innerText で一致判定が行われますが、selectValueMatch パラメータを指定することで、option 要素の value 属性で一致判定を行うことができます。

		$('#data').exTableFilter({
			filters : {
				2 : {
					element : '#category-filter',
					selectValueMatch : true
				}
			}
		});

[Demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html#demo08)

## パラメータ

プラグイン実行時、下記パラメータを指定できます。

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

## API

API オブジェクトを使用し、下記メソッドを実行できます。

	// プラグイン適用要素の独自データ属性(data-ex-table-filter)を取得する
	getDataParam : function(){

	// プラグイン適用要素を取得する
	getTarget : function(){

	// フィルタリング中のフィルタを取得する
	getCurrentFilter : function(){

	// フィルタリング中のフィルタの値を取得する
	getCurrentFilterVal : function(){

	// フィルタリング中のフィルタの値を数値変換して取得する
	getCurrentFilterNum : function(){

	// フィルタリング中の TR 要素を取得する
	getCurrentRow : function(){

	// フィルタリング中の TH/TD 要素を取得する
	getCurrentCell : function(index){

	// フィルタリング中の TH/TD 要素の値を取得する
	getCurrentCellVal : function(index){

	// フィルタリング中の TH/TD 要素の値を数値変換して取得する
	getCurrentCellNum : function(index){

	// フィルタリング中の行の表示状態を取得する
	isShowCurrentRow : function(){

	// 各カラムのフィルタ条件を配列又は JSON 形式でまとめて設定する
	setFilters : function(filters, config){

	// 特定のカラムのフィルタ条件を設定する
	setFilter : function(index, filter, config){

	// フィルタリングを実行する
	filtering : function(){

## API オブジェクトの取得方法

API オブジェクトは以下の方法で取得することができます。

### コールバック関数内で取得

	$(target).exTableFilter({
		callback : function(api){
			api
		},
	});

### data() メソッドで取得

	var api = $(target).exTableFilter().data($.plugin.id);

### API パラメータを指定して取得

	var api = $(target).exTableFilter({api:true});

## ダウンロード

こちらからどうぞ。

- [jQuery Ex Table Filter - GitHub](https://github.com/cyokodog/jquery.ex-table-filter)


