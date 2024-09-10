import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//const controls = new OrbitControls( camera, renderer.domElement );

var scene, renderer;
export var controls, camera;

var mywidth, myheight, mydepth;
var instances = null;

var posns;
let spacing = 2.0;//3.33;
let opacity = 0.25;
let sizing = 0.1;
var rainbow = null;
let immortals = false;
var material, geometry;
export var colorBal = [255, 255, 255];

export function setOpacity(o) {
    opacity = o;
    console.log("Opacity: " + opacity);
    if( material == null ) return;
    buildInstances();
}
export function setSpacing(s) {
    spacing = s;
    console.log("Spacing: " + spacing);
    if( material == null ) return;
    buildInstances();
    controls.target = new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5);
    controls.update();
}
export function setSizing(s) {
    sizing = s;
    console.log("Sizing: " + sizing);
    if( material == null ) return;
    buildInstances();
}
export function toggleImmortals(s) {
    immortals = s;
    console.log("Immortals: " + s);
}
export function setColorBal(i, v)
{
    colorBal[i] = v;
    if( colorBal[i] < 0 ) colorBal[i] = 0;
    console.log("colorBal(" + i + ")=" + v);
}

function rain(fullW, fullH) {
    var i, j;
    var r, b;

    rainbow = new Array(fullH);
    for( i=0; i<fullH; i++ ) {
        rainbow[i] = new Array(fullW);
        r = ((fullH-i)/fullH)*0.66;
        for( j=0; j<fullW; j++ ) {
            b = ((fullW-(j*0.5))/fullW);
            rainbow[i][j] = [r,b];
        }
    }
    return rainbow;
}

function threeReCanvas( el, wid, hgt )
{
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );
}
export function getCameraControls()
{
    return [camera,controls];
}
export function threeCanvas(el, wid, hgt)
{
    if( rainbow != null ) {
        return threeReCanvas(el,wid,hgt);
    }
    rain(100,100);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );
   
    controls = new OrbitControls( camera, renderer.domElement );

    //var light1 = new THREE.PointLight(0xffffff, 100, 500, 0.1);
    //light1.position.set(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*(0.5));
    //scene.add(light1);
    /*
    var light2 = new THREE.PointLight(0x00ffc3, 100, 500, 0.1);
    light2.position.set(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*(0.5));
    scene.add(light2);
    */

    var light3 = new THREE.AmbientLight(0xffffff, 5.0);
    scene.add(light3);/*
    light1.castShadow = true;
    light1.shadow.camera.near = 1
    light1.shadow.camera.far = 1000
    light1.shadow.camera.left = -50
    light1.shadow.camera.right = 50
    light1.shadow.camera.top = 50
    light1.shadow.camera.bottom = -50
    */
    
    /*
    light1.castShadow = true
    light1.shadow.camera.near = 1
    light1.shadow.camera.far = 1000
    light1.shadow.camera.left = -50
    light1.shadow.camera.right = 50
    light1.shadow.camera.top = 50
    light1.shadow.camera.bottom = -50
    */

    mywidth = wid;
    myheight = hgt;
    mydepth = Math.floor( (wid+hgt)/2 );
    //material.wireframe = true;
    buildInstances();

    //camera.position.set( mywidth*spacing*0.5, 0, -mydepth*spacing*0.5 );
    //camera.position.set( mywidth*spacing*0.5, myheight*spacing*0.5, 0 );
    camera.position.set( mywidth*spacing*0.5, myheight*spacing*0.5, -mydepth*spacing*0.1 );
    camera.lookAt(new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing) );//mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5));
    controls.target = new THREE.Vector3(mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5);
    controls.update();
}

function buildInstances()
{
    if( instances != null )
        scene.remove(instances);
    geometry = new THREE.BoxGeometry( sizing, sizing, sizing );
    material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    material.opacity = opacity;
    material.transparent = true;
    instances = new THREE.InstancedMesh( geometry, material, mywidth*myheight*mydepth );
    instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
    let oneframe = mywidth*myheight;
    var i,j,k;
    posns = new Array(mydepth);
    for( i=0; i<mydepth; i++ ) {
        posns[i] = new Array(myheight);
        for( j=0; j<myheight; j++ ) {
            posns[i][j] = new Array(mywidth).fill(0);
        }
    }
    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {
                instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( .5,.5,.5 ) );
                instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
            }
        }
    }
    instances.instanceColor.needsUpdate = true;
    //instances.castShadow = instances.receiveShadow = true;
    scene.add(instances);
}


export function threeRender()
{
    var cube;

    var i,j,k;
    var n=0;
    var oneframe = mywidth*myheight;
    var dtn = new Date().getTime()/1000;
    var life, red, green, blue;

    controls.update();

    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {

                if( cells[i][j][k] === 0 ) {
                    if( posns[i][j][k] === 0 ) continue;
                    posns[i][j][k] = 0;
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                    continue;
                }

                life = dtn - lifetime[i][j][k];
                red = rainbow[j][k][0];
                green = rainbow[j][k][1];
                blue = life/20 > 255 ? 255 : life/20;
                /*
                if( life < 25 ) {
                    red /= 3;
                    blue /= 3;
                    green = 0;
                } else if( life < 50 ) {
                    red /= 2;
                    blue /= 2;
                    green = life*3/255;
                } else if( life < 300 ) {
                    green = life*6/255;
                } else {
                    red=green=blue = 10;
                    //red += life/10;
                }*/

                let factor = cells[i][j][k]/2;
                red *= factor * colorBal[0];
                green *= factor*colorBal[1];
                blue *= factor * colorBal[2];
                if( immortals ) {
                    if( red > 186 ) red=128; if( green > 186 ) green=128; if( blue > 186*0.7 ) blue=128;
                } else {
                    if( red > 186 ) red=0; if( green > 186 ) green=0; if( blue > 186*0.7 ) blue=0;
                }

                if( red < 50 ) red = 50;
                if( red > 200 ) red = 200;
                if( green > 200 ) green = 200;
                if( blue < 100 ) blue = 100;

                instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( -.05 + red/300.0, -0.1 + green/400.0, 0.2 + blue/300.0 ) );

                
                if( (cells[i][j][k]>0) == (posns[i][j][k]>0) ) continue;
                posns[i][j][k] = cells[i][j][k];

                if( cells[i][j][k] > 0 ) {
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( i*spacing, j*spacing, k*spacing ) );
                } else {
                    instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
                }
            }
        }
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.instanceColor.needsUpdate = true;
    //instances.computeBoundingSphere();

    renderer.render( scene, camera );
}
