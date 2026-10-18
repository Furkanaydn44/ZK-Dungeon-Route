pragma circom 2.0.0;



template DungeonRoute(N) {


    signal input steps[N];        

    signal input startX;          
    signal input startY;          
    signal input treasureX;      
    signal input treasureY;       


    signal posX[N + 1];           
    signal posY[N + 1];           

   
    signal isNorth[N];
    signal isSouth[N];
    signal isEast[N];
    signal isWest[N];

  
    signal prod12[N];
    signal prod34[N];

   
    signal dX[N];
    signal dY[N];

  
    posX[0] <== startX;
    posY[0] <== startY;

  
    for (var i = 0; i < N; i++) {

     
        isNorth[i] <-- steps[i] == 1 ? 1 : 0;
        isSouth[i] <-- steps[i] == 2 ? 1 : 0;
        isEast[i]  <-- steps[i] == 3 ? 1 : 0;
        isWest[i]  <-- steps[i] == 4 ? 1 : 0;

        
        isNorth[i] * (1 - isNorth[i]) === 0;
        isSouth[i] * (1 - isSouth[i]) === 0;
        isEast[i]  * (1 - isEast[i])  === 0;
        isWest[i]  * (1 - isWest[i])  === 0;

        
        isNorth[i] + isSouth[i] + isEast[i] + isWest[i] === 1;

     
        isNorth[i] * (steps[i] - 1) === 0;
        isSouth[i] * (steps[i] - 2) === 0;
        isEast[i]  * (steps[i] - 3) === 0;
        isWest[i]  * (steps[i] - 4) === 0;

     
        prod12[i] <== (steps[i] - 1) * (steps[i] - 2);
        prod34[i] <== (steps[i] - 3) * (steps[i] - 4);
        prod12[i] * prod34[i] === 0;

       
        dX[i] <== isEast[i] - isWest[i];
        dY[i] <== isSouth[i] - isNorth[i];

       
        posX[i + 1] <== posX[i] + dX[i];
        posY[i + 1] <== posY[i] + dY[i];
    }

   
    posX[N] === treasureX;
    posY[N] === treasureY;
}

component main {public [startX, startY, treasureX, treasureY]} = DungeonRoute(100);
