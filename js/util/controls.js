
import { player, isMouseDown, terrain, mixers } from '../index2.js'
const container = document.body;
const menu = document.querySelector('#menu');
const blocker = document.querySelector('#blocker')


let controls;
let moveForward = false
let moveLeft = false
let moveBackward = false 
let moveRight = false
let rotateLeft = false
let rotateRight = false
let sprint = false
let crouch = false
let oldX = 0
let raycaster = new THREE.Raycaster()
let down = new THREE.Vector3(-1,-1,-1)
let prevTime = performance.now();
let velocity = new THREE.Vector3()
let direction = new THREE.Vector3()

let danceAction
let deathAction
let idleAction
let jumpAction
let noAction
let punchAction
let runAction
let sitAction
let standAction
let thumbsUpAction
let walkAction
let walkJumpAction
let waveAction
let yesAction
let actions


let physicsBody
export function createControls(camera){
    controls = new THREE.PointerLockControls( camera, container )
    
    menu.addEventListener( 'click', () => {

        controls.lock();

    }, false );
    controls.addEventListener( 'lock', () => {
        blocker.style.display = 'none';
        menu.style.display = 'none';
        console.log(controls.isLocked)
    } );

    controls.addEventListener( 'unlock', () => {
        blocker.style.display = 'block';
        menu.style.display = '';

    } );
    return controls;
}


export const onKeyDown = ( event ) => {
    switch( event.keyCode ) {
        case 87: //w
            moveForward = true
            break
        case 65: //a
            moveLeft = true
            break
        case 83: //s
            moveBackward = true
            break
        case 68: //d
            moveRight = true
            break
        case 16: //shift
            sprint = true
            break
        case 17: //control
            crouch = true
            break
    }
};
export const onMouseMove = (event) => {
    if(controls.isLocked && isMouseDown){
        const {
            movementX,
            movementY
        } = event;
        let val = movementX
        if (val < 0){
            rotateRight = false
            rotateLeft = true
        }
        else if (val > 0){
            rotateLeft = false
            rotateRight = true
        }
        else if (val == oldX){
            rotateLeft = false
            rotateRight = false
        }
        oldX = val
    }
    else{
        rotateLeft = false
        rotateRight = false
    }
}
export const onKeyUp = ( event ) => {
    switch( event.keyCode ) {
        case 87: //w
            moveForward = false
            break
        case 65: //a
            moveLeft = false
            break
        case 83: //s
            moveBackward = false
            break
        case 68: //d
            moveRight = false
            break
        case 16: //shift
            sprint = false
            break
        case 17: //control
            crouch = false
            break
    }
}

export function updateControls() {
    if( controls.isLocked && player !== undefined) {
        physicsBody = player.userData.physicsBody;

        let time = performance.now();
        let delta = ( time - prevTime ) / 1000;
        
        // raycaster.set( player.position, down );
        // let cols = (raycaster.intersectObject(terrain))
        // // let cols = []
        // // console.log(cols)
        // if(cols[0])
        //     player.position.y = cols[0].point.y + 2.5
        // direction.z = Number( moveForward ) - Number( moveBackward );
        // direction.x = Number( moveRight ) - Number( moveLeft );
        // direction.normalize(); // this ensures consistent movements in all directions

        // //If both sprint and crouch are pressed, crouch will not be activated
        // if (sprint && crouch){
        //     crouch = false;
        // }

        if ( rotateLeft )  player.rotateOnAxis(new THREE.Vector3(0,1,0), rotateAngle);
        if ( rotateRight )  player.rotateOnAxis(new THREE.Vector3(0,1,0), -rotateAngle);
        let moveX =  Number( moveRight ) - Number( moveLeft );
        let moveZ =  Number( moveForward ) - Number( moveBackward );
        let moveY =  0;
        if( moveX == 0 && moveY == 0 && moveZ == 0) return;

        let vertex = new THREE.Vector3(moveX,moveY,moveZ);
        vertex.applyQuaternion(player.quaternion);
        let factor = 100
        if(sprint)
            factor = factor * 2
        let resultantImpulse = new Ammo.btVector3( -vertex.x, 0, vertex.z );
        resultantImpulse.op_mul(factor);

        physicsBody.setLinearVelocity ( resultantImpulse );
 
        if (crouch){
            var relativeCameraOffset = new THREE.Vector3(0,4,-10);
        }
        else{
            var relativeCameraOffset = new THREE.Vector3(0,5,-10);
        }

        var cameraOffset = relativeCameraOffset.applyMatrix4(player.matrixWorld )
        controls.getObject().position.x = cameraOffset.x
        controls.getObject().position.y = cameraOffset.y
        controls.getObject().position.z = cameraOffset.z

        controls.getObject().lookAt(player.position)

        prevTime = time

    }

    else if(player !== undefined){
        physicsBody = player.userData.physicsBody;

        physicsBody.setLinearVelocity ( new Ammo.btVector3( 0, 0, 0 ) );
    }


}




function activateAllActions(){
    //let i
    //for (i = 0; i < actions.length; i++) {
    //    setWeight(actions[i], 0.0);
    //}
    setWeight(danceAction, 0.0);
    setWeight(deathAction, 0.0);
    setWeight(idleAction, 1.0);
    setWeight(jumpAction, 0.0);
    setWeight(noAction, 0.0);
    setWeight(punchAction, 0.0);
    setWeight(runAction, 0.0);
    setWeight(sitAction, 0.0);
    setWeight(standAction, 0.0);
    setWeight(thumbsUpAction, 0.0);
    setWeight(walkAction, 0.0);
    setWeight(walkJumpAction, 0.0);
    setWeight(waveAction, 0.0);
    setWeight(yesAction, 0.0);


    actions.forEach( function ( action ) {
        action.play();
    } );
}

function prepareCrossFade( startAction, endAction, defaultDuration ){
    var duration = defaultDuration;
    if (startAction === idleAction){
        executeCrossFade(startAction, endAction, duration)
    } else{
        synchronizeCrossFade(startAction, endAction, duration);
    }
}

function synchronizeCrossFade(startAction, endAction, duration){
    mixers[0].addEventListener('loop', onLoopFinished);
    function onLoopFinished(event){
        if (event.action === startAction){
            mixers[0].removeEventListener('loop', onLoopFinished);
            executeCrossFade(startAction, endAction, duration);
        }
    }
}

function executeCrossFade(startAction, endAction, duration){
    setWeight(endAction, 1);
    endAction.time = 0;
    startAction.crossFadeTo(endAction, duration, true);
}

function setWeight(action, weight){
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
}

//Timeout needed because character mixer hasnt been created yet
setTimeout(function(){
    danceAction = mixers[0].clipAction(player.animations[0])
    deathAction = mixers[0].clipAction(player.animations[1])
    idleAction = mixers[0].clipAction(player.animations[2])
    jumpAction = mixers[0].clipAction(player.animations[3])
    noAction = mixers[0].clipAction(player.animations[4])
    punchAction = mixers[0].clipAction(player.animations[5])
    runAction = mixers[0].clipAction(player.animations[6])
    sitAction = mixers[0].clipAction(player.animations[7])
    standAction = mixers[0].clipAction(player.animations[8])
    thumbsUpAction = mixers[0].clipAction(player.animations[9])
    walkAction = mixers[0].clipAction(player.animations[10])
    walkJumpAction = mixers[0].clipAction(player.animations[11])
    waveAction = mixers[0].clipAction(player.animations[12])
    yesAction = mixers[0].clipAction(player.animations[13])

    actions = [danceAction, deathAction, idleAction, jumpAction, noAction, punchAction, runAction, sitAction, standAction, thumbsUpAction, walkAction, walkJumpAction, waveAction, yesAction]
    activateAllActions();
 }, 6000);