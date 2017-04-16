/**
 * Created by halder on 15-Apr-17.
 */
var arr = [ {palletID_: 1492328321500,
    frameType_: 2,
    frameColor_: 'BLUE',
    screenType_: 5,
    screenColor_: 'GREEN',
    keyType_: 9,
    keyColor_: 'RED',
    status_: 0,
    path_:
[ [ 'WS1' ],
    [ 'WS4', 'WS8', 'WS11' ],
    [ 'WS3', 'WS6', 'WS10' ],
    [ 'WS2', 'WS5', 'WS9', 'WS12' ] ]}, {palletID_: 1492328321501,
    frameType_: 2,
    frameColor_: 'BLUE',
    screenType_: 5,
    screenColor_: 'GREEN',
    keyType_: 10,
    keyColor_: 'RED',
    status_: 0,
    path_:
        [ [ 'WS1' ],
            [ 'WS4', 'WS8', 'WS11' ],
            [ 'WS3', 'WS6', 'WS10' ],
            [ 'WS2', 'WS5', 'WS9', 'WS12' ] ]}, {palletID_: 1492328321502,
    frameType_: 2,
    frameColor_: 'BLUE',
    screenType_: 5,
    screenColor_: 'GREEN',
    keyType_: 8,
    keyColor_: 'RED',
    status_: 0,
    path_:
        [ [ 'WS1' ],
            [ 'WS4', 'WS8', 'WS11' ],
            [ 'WS3', 'WS6', 'WS10' ],
            [ 'WS2', 'WS5', 'WS9', 'WS12' ] ]}
];

function findPallet(palletID){
    for(var i=0;i<arr.length;i++){
        if(arr[i].palletID_ == palletID)
        {
            console.log(arr[i]);
        }
    }
}

findPallet(1492328321502);