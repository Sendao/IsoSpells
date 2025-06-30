var rNums = [];
var qrrC = 0, rndMax=2000;
var qrcC = 0;

var gravTimeout=40;
var gravTimer=-1;
var running = false;
var runningtime = null;
var bgTimer=-1;
var paused = true;

var maxtime = 120;

function qRandom(min, max) {
  let range = 1.0;

  if( typeof max != 'undefined' ) {
    range = max-min;
  } else if( typeof min != 'undefined' ) {
    range = min;
    min = 0.0;
  } else min = 0.0;

  if( rNums.length < rndMax ) {
    let myseed = Math.random(); // initial random seed
    your_other_seed=Math.random();

    while( rNums.length < rndMax ) {
      rNums.push( myseed*Math.random() );
    }
  }
  qrrC++;
  if( qrrC >= rNums.length ) qrrC -= rNums.length;
  qrcC += Math.floor( rNums[qrrC] * 50 );
  while( qrcC >= rNums.length ) qrcC -= rNums.length;
  let x = (rNums[qrrC]*0.1 + rNums[qrcC]*0.9);

  return min+x*range;
};


function pause() {
  paused=!paused;
  if( !paused ) {
    setImmediate(animdone);
  }
}
function resume(){
  paused=false;
  setImmediate(animdone);
}

function setImmediate(cb) {
  if( paused ) return;
  setTimeout(cb,0);
}

function recycle_background() {
  animdone();
}

function animdone() {
  var td, tx = new Date().getTime();
  if( bgTimer == -1 ) {
    bgTimer = setInterval( 1000, recycle_background );
  }
  if( gravTimer !== -1 )
    clearTimeout(gravTimer);

  if( paused ) return;
  
  if( runningtime === null ) {
    setImmediate(intanimate);
    return;
  }

  td = tx - runningtime;
  runningtime=null;
  if( td > maxtime )
    gravTimeout=0;
  else if( gravTimeout < td*2 || gravTimeout < 100 ) { // using too much cpu.
    gravTimeout += td/3;
  } else if( gravTimeout > td*2 ) { // going too slowly.
    gravTimeout -= td/3;
  }
  gravTimer = setTimeout( intanimate, gravTimeout );
  if( gravTimeout > 100 )
    setTimeout( animdone, gravTimeout-30 );
}

function intanimate()
{
  if( running || paused )
    return;

  running = true;

  let time_now = new Date().getTime();
  animate();
  runningtime = time_now;
  running=false;

  setImmediate(animdone);
}