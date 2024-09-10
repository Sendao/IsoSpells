import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//const controls = new OrbitControls( camera, renderer.domElement );

var scene, camera, renderer;

var mywidth, myheight, mydepth;
var instances;

var posns;

export function threeCanvas(el, wid, hgt)
{
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    el.appendChild( renderer.domElement );

    mywidth = wid;
    myheight = hgt;
    mydepth = Math.floor( (wid+hgt)/2 );
    var i,j,k;
    posns = new Array(mydepth);
    for( i=0; i<mydepth; i++ ) {
        posns[i] = new Array(myheight);
        for( j=0; j<myheight; j++ ) {
            posns[i][j] = new Array(mywidth).fill(0);
        }
    }

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    material.opacity = 0.2;
    material.transparent = true;
    //material.wireframe = true;
    instances = new THREE.InstancedMesh( geometry, material, mywidth*myheight*mydepth );
    //instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
    let oneframe = mywidth*myheight;
    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {
                var r = 0.05 + (i/mydepth)*0.5;
                var g = 0.05 + (j/myheight)*0.5;
                var b = 0.05 + (k/mywidth)*0.5;
                instances.setColorAt( i*oneframe + j*mywidth + k, new THREE.Color( r,g,b ) );
                instances.setMatrixAt( i*oneframe + j*mywidth + k, new THREE.Matrix4().makeTranslation( 0, 0, -10000 ) );
            }
        }
    }
    instances.instanceColor.needsUpdate = true;
    scene.add(instances);

    //const light1 = new THREE.DirectionalLight(0x00ff00, 0.1);
    //scene.add(light1);
    const light2 = new THREE.AmbientLight(0xff00000, 1);
    scene.add(light2);

    camera.position.set( mywidth*spacing*0.8, myheight*spacing*0.8, mydepth*spacing*0.5 );
    camera.lookAt(new THREE.Vector3(mywidth*spacing*0.8,0,mydepth*spacing*0.5) );//mywidth*spacing*0.5, myheight*spacing*0.5, mydepth*spacing*0.5));
}

let spacing = 2.0;
export function threeRender()
{
    var cube;

    var i,j,k;
    var n=0;
    var oneframe = mywidth*myheight;

    for( i=0; i<mydepth; i++ ) {
        for( j=0; j<myheight; j++ ) {
            for( k=0; k<mywidth; k++ ) {
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
    //instances.computeBoundingSphere();

    renderer.render( scene, camera );
}
