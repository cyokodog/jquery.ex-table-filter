jquery.ex-table-filter
=======================

汎用性を重視したテーブルフィルタリング系の jQuery プラグインです。

- [使い方](http://www.cyokodog.net/blog/extablefilter/)
- [demo](http://cyokodog.github.io/jquery.ex-table-filter/demo.html) 

## 変更履歴

- v0.5
	- フィルタ条件の入力フィールドを自動生成する機能を追加しました。
	- Excel のオートフィルタのようなプルダウン、ラジオボタン、チェックボックスによる条件入力フィールドの自動生成機能を追加しました。
	- QueryString によるフィルタリング機能を追加しました。
	- Bootstrap3 対応。
	- 使用手順の説明、デモを大幅刷新しました。
 
- v0.4
	- １つの条件入力フィールドを複数カラムに対し適用した場合、当該フィールドについては OR 条件でフィルタされるようにした。
 
- v0.3
	- プラグインの実行時、パラメータ名を指定ぜずフィルター要素のみを指定できるようにした。 $(‘table’).exTableFilter([ '.filter1', '.filter2', ... ])
 

- v0.2
	- select > option 要素の value 属性でフィルタリング可能にした。（selectValueMatch パラメータの追加）
