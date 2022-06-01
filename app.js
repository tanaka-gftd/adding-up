'use strict';
const fs = require('fs');   //ファイルを扱うモジュールを呼び出し
const readline = require('readline');   //ファイルを1行づつ読み込むためのモジュール
const rs = fs.createReadStream('./popu-pref.csv');   //ファイルを読み込むストリーム生成
const rl = readline.createInterface({ input: rs });   //↑で生成したストリームをreadlineオブジェクトのinputとして設定
const prefectureDataMap = new Map();   // keyを都道府県 valueを集計データのオブジェクト として管理するためにMapを使用

//rlオブジェクトでlineというイベントが発生したら、実行する処理
rl.on('line', lineString => {
    const column = lineString.split(','); //引数lineStringで与えられた文字列を、コンマで分割して配列化
    const year = parseInt(column[0]);   //集計年（文字列として扱われているので、parseIntで数値化）
    const prefecture = column[1];       //都道府県
    const popu = parseInt(column[3]);   //15~19歳の人口（文字列として扱われているので、parseIntで数値化）
    
    if ( year === 2010 || year === 2015) {
        //console.log(year);
        //console.log(prefecture);
        //console.log(popu);

        let value = null;
        if(prefectureDataMap.has(prefecture)) {
            value = prefectureDataMap.get(prefecture);
        } else {
            value = {
                popu10: 0,    //2010年の人口（初期値は０）
                popu15: 0,    //2015年の人口（初期値は０）
                change: null  //変化率（初期値はnull）
            };
        }
        if (year === 2010) {
            value.popu10 = popu;
        }
        if (year === 2015) {
            value.popu15 = popu;
        }
        prefectureDataMap.set(prefecture, value);
    }
});

//'close' イベントは、全ての行を読み込み終わった際に呼び出される
rl.on('close', () => {
    for(const [key, value] of prefectureDataMap){
        value.change = value.popu15 / value.popu10;
    }
    //Array.fromで連想配列を通常の配列にする(連想配列のキーと値を、インデックス２個の配列にする)
    //例  連想配列{'北海道' => { popu10: 258530, popu15: 236840, change: 0.9161025799713767 }, {.....}, {.....}, .....{.....}}
    //   [['北海道', { popu10: 258530, popu15: 236840, change: 0.9161025799713767 }], [.....], [.....], ..... [.....]]
    //その後人口変化率を基準に sort関数で降順にする（sort関数に引数を二つ渡しているのは、それがsort関数の書式だから）
    //アロー関数では、宣言された式が自動的に return されるので、続く {} と return を省略してもOK（ここでは、分かりやすさ優先のために記載している）
    const rankingArray = Array.from(prefectureDataMap).sort((pair1, pair2) => {
        
        /* 
        sort関数のコールバック関数が、
            負数を返した場合：ある要素と、その次の要素では、ある要素→次の要素の順に並び変わる
            0より大きい値を返した場合：ある要素と、その次の要素では、次の要素→ある要素の順に並び変わる
            0を返した場合：何もしない 

            とりあえず、コールバック関数内での指定が
            「第１引数 - 第２引数」 なら 昇順ソート（小→大）
            「第２引数 - 第１引数」 なら 降順ソート（大→小）
            という認識でOK
        */
        return pair2[1].change - pair1[1].change;
        
    });

    //表示されるものを、map関数を使って可読しやすい配列に整形
    //＊map関数 は Map とは違うものです
    const rankingStrings = rankingArray.map(([key,value]) => {
        return (
            `${key}: ${value.popu10}=>${value.popu15} 変化率: ${value.change}`
        );
    });
    console.log(rankingStrings);
})