"use strict";

var gl;
var canvas;

var lightPosition = vec4(5.0, 5.0, 5.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var modelViewMatrix;
var projectionMatrix;
var fov = 60;
var near = 0.5;
var far = 1000;
var radius = 5;
var x;
var y = 1;
var z;
var eye;
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);
var degrees = 90;
var angles;

// Red Sphere
var redSphereVertexPointer;
var redSphereMVLocation;
var redSpherePVLocation;
var redSphereNormalsPointer;
var redSphereNormalsLocation;
var redSphereMatAmbient = vec4(1.0, 0.0, 0.0, 1.0);
var redSphereMatDiffuse = vec4(1.0, 0.0, 0.0, 1.0);
var redSphereMatSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var redSphereMatShininess = 25.0;
var redSphereProdAmbient;
var redSphereProdDiffuse;
var redSphereProdSpecular;
var redSphereProgram;

// Blue Sphere
var blueSphereVertexPointer;
var blueSphereMVLocation;
var blueSpherePVLocation;
var blueSphereNormalsPointer;
var blueSphereNormalsLocation;
var blueSphereMatAmbient = vec4(0.0, 0.0, 1.0, 1.0);
var blueSphereMatDiffuse = vec4(0.0, 0.0, 1.0, 1.0);
var blueSphereMatSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var blueSphereMatShininess = 20.0;
var blueSphereProdAmbient;
var blueSphereProdDiffuse;
var blueSphereProdSpecular;
var blueSphereProgram;

// Other Sphere Stuff
var index = 0;
var numTimesToSubdivide = 3;
var sphereVertexArray = [];
var sphereVertexBuffer;
var sphereNormalsArray = [];
var sphereNormalsBuffer;
var sphereNormalMatrix;
var sphereCoords = [
    vec4( 0.0, 0.0,-1.0, 1),
    vec4( 0.0, 0.9, 0.3, 1),
    vec4(-0.8,-0.5, 0.3, 1),
    vec4( 0.8,-0.5, 0.3, 1)
];


// Floor
var programFloor;
var floorVertexArray = [];
var floorVertexBuffer;
var floorVertexPointer;
var floorMVLocation;
var floorPVLocation;
var floorCoords = [
    vec4(-1,-1,-1, 1),
    vec4( 1,-1,-1, 1),
    vec4(-1,-1, 1, 1),
    vec4( 1,-1, 1, 1)
];
var floorTextureArray = [];
var floorTextureBuffer;
var floorTexturePointer;
var texture;
var texSize = 32;
var texCoord = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 1)
];

var image1 = new Array();
    for(var i = 0; i < texSize; i++) { 
		image1[i] = new Array();
	}
	
    for(var i = 0; i < texSize; i++) {
        for(var j = 0; j < texSize; j++) {
            image1[i][j] = new Float32Array(4);
		}
	}
	
    for(var i = 0; i < texSize; i++) {
        for(var j = 0; j < texSize; j++) {
            var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
            image1[i][j] = [c, c, c, 1];
        }
	}
	

var image2 = new Uint8Array(4 * texSize * texSize);
    for(var i = 0; i < texSize; i++) {
        for(var j = 0; j < texSize; j++) {
            for(var k = 0; k < 4; k++) {
                image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];
			}
		}
	}

window.onload = function init() {
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) alert("WebGL isn't available.");
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.enable(gl.DEPTH_TEST);
	
    blueSphereProgram = initShaders(gl, "sphereBv", "sphereBc");
    redSphereProgram = initShaders(gl, "sphereRv", "sphereRc");
    programFloor = initShaders(gl, "floorV", "floorC");
    createFloor();
    createSphere(sphereCoords[0], sphereCoords[1], sphereCoords[2], sphereCoords[3], numTimesToSubdivide);
    configureTexture(image2);
    
	// Lights and Camera (ACTION!)  
    blueSphereProdAmbient = mult(lightAmbient, blueSphereMatAmbient);
    blueSphereProdDiffuse = mult(lightDiffuse, blueSphereMatDiffuse);
    blueSphereProdSpecular = mult(lightSpecular, blueSphereMatSpecular);
    redSphereProdAmbient = mult(lightAmbient, redSphereMatAmbient);
    redSphereProdDiffuse = mult(lightDiffuse, redSphereMatDiffuse);
    redSphereProdSpecular =  mult(lightSpecular, redSphereMatSpecular);
    blueSphereMVLocation = gl.getUniformLocation(blueSphereProgram, "modelViewMatrix");
    blueSpherePVLocation = gl.getUniformLocation(blueSphereProgram, "projectionMatrix");
    redSphereMVLocation = gl.getUniformLocation(redSphereProgram, "modelViewMatrix");
    redSpherePVLocation = gl.getUniformLocation(redSphereProgram, "projectionMatrix");
    floorMVLocation = gl.getUniformLocation(programFloor, "modelViewMatrix");
    floorPVLocation = gl.getUniformLocation(programFloor, "projectionMatrix");
    blueSphereNormalsLocation = gl.getUniformLocation(blueSphereProgram, "normalMatrix");
    redSphereNormalsLocation = gl.getUniformLocation(redSphereProgram, "normalMatrix");
    initializeCamera();
    
    // Controls
    window.addEventListener("keydown", function() {
       if(event.keyCode == 65 || event.keyCode == 37) {    // A (left)
           degrees -= 5;
           angles = radians(degrees);
           x = radius * Math.cos(angles);
           z = radius * Math.sin(angles);
       }
       if(event.keyCode == 68 || event.keyCode == 39) {    // D (right)
           degrees += 5;
           angles = radians(degrees);
           x = radius * Math.cos(angles);
           z = radius * Math.sin(angles);
       }
    });    
    
    render();
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projectionMatrix = perspective(fov, canvas.width / canvas.height, near, far);
    eye = vec3(x, y, z);
    modelViewMatrix = lookAt(eye, at, up);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    
	// Draw Stuff
    drawSpheres();
    drawFloor();
    requestAnimFrame(render);
}

//======================================================================
function drawSpheres() {
	
// Red 
	gl.useProgram(redSphereProgram);

	// vertex and normal
    sphereVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertexArray), gl.STATIC_DRAW);
    redSphereVertexPointer = gl.getAttribLocation(redSphereProgram, "vPosition");
    gl.vertexAttribPointer(redSphereVertexPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(redSphereVertexPointer);
	
    sphereNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereNormalsArray), gl.STATIC_DRAW);
    redSphereNormalsPointer = gl.getAttribLocation(redSphereProgram, "vNormal");
    gl.vertexAttribPointer(redSphereNormalsPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(redSphereNormalsPointer);

    gl.uniformMatrix4fv(redSphereMVLocation, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(redSpherePVLocation, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(redSphereNormalsLocation, false, flatten(normalMatrix));
    gl.uniform4fv(gl.getUniformLocation(redSphereProgram, "ambientProduct"), flatten(redSphereProdAmbient));
    gl.uniform4fv(gl.getUniformLocation(redSphereProgram, "diffuseProduct"), flatten(redSphereProdDiffuse));
    gl.uniform4fv(gl.getUniformLocation(redSphereProgram, "specularProduct"), flatten(redSphereProdSpecular));
    gl.uniform4fv(gl.getUniformLocation(redSphereProgram, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(redSphereProgram, "shininess"), redSphereMatShininess);
    
    // draws it
    for(var i = 0; i < index; i += 3) gl.drawArrays(gl.TRIANGLES, i, 3);
	
// Blue does same thing
    gl.useProgram(blueSphereProgram);
    
    sphereVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereVertexArray), gl.STATIC_DRAW);
    blueSphereVertexPointer = gl.getAttribLocation(blueSphereProgram, "vPosition");
    gl.vertexAttribPointer(blueSphereVertexPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(blueSphereVertexPointer);

    sphereNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereNormalsArray), gl.STATIC_DRAW);
    blueSphereNormalsPointer = gl.getAttribLocation(blueSphereProgram, "vNormal");
    gl.vertexAttribPointer(blueSphereNormalsPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(blueSphereNormalsPointer);

    gl.uniformMatrix4fv(blueSphereMVLocation, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(blueSpherePVLocation, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(blueSphereNormalsLocation, false, flatten(normalMatrix));
    gl.uniform4fv(gl.getUniformLocation(blueSphereProgram, "ambientProduct"), flatten(blueSphereProdAmbient));
    gl.uniform4fv(gl.getUniformLocation(blueSphereProgram, "diffuseProduct"), flatten(blueSphereProdDiffuse));
    gl.uniform4fv(gl.getUniformLocation(blueSphereProgram, "specularProduct"), flatten(blueSphereProdSpecular));
    gl.uniform4fv(gl.getUniformLocation(blueSphereProgram, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(blueSphereProgram, "shininess"), blueSphereMatShininess);
    
    for(var i = 0; i < index; i += 3) gl.drawArrays(gl.TRIANGLES, i, 3);
    
}


function drawFloor() {
    gl.useProgram(programFloor);
    
    // Vertex
    floorVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(floorVertexArray), gl.STATIC_DRAW);
    
    floorVertexPointer = gl.getAttribLocation(programFloor, "vPosition");
    gl.vertexAttribPointer(floorVertexPointer, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(floorVertexPointer);
    
	// Uniforms
    gl.uniformMatrix4fv(floorMVLocation, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(floorPVLocation, false, flatten(projectionMatrix));
	
    // Texture
    floorTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(floorTextureArray), gl.STATIC_DRAW);
    
    floorTexturePointer = gl.getAttribLocation(programFloor, "vTexCoord");
    gl.vertexAttribPointer(floorTexturePointer, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(floorTexturePointer);
    
    //Draw the floor
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function createFloor() {
    floorVertexArray.push(floorCoords[0]);
    floorVertexArray.push(floorCoords[1]);
    floorVertexArray.push(floorCoords[2]);
    floorVertexArray.push(floorCoords[3]);
    
    floorTextureArray.push(texCoord[0]);
    floorTextureArray.push(texCoord[1]);
    floorTextureArray.push(texCoord[2]);
    floorTextureArray.push(texCoord[3]);
}

function configureTexture(image) {
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function initializeCamera() {
    angles = radians(degrees);
    x = radius * Math.cos(angles);
    z = radius * Math.sin(angles);
}

function createSphere(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if(count > 0) {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
        
        divideTriangle( a, ab, ac, count-1);
        divideTriangle(ab,  b, bc, count-1);
        divideTriangle(bc,  c, ac, count-1);
        divideTriangle(ab, bc, ac, count-1);
    } else {
        triangle(a, b, c);
    }
}

function triangle(a, b, c) {
    sphereVertexArray.push(a);
    sphereVertexArray.push(b);
    sphereVertexArray.push(c);
    
    sphereNormalsArray.push(a[0], a[1], a[2], 0);
    sphereNormalsArray.push(b[0], b[1], b[2], 0);
    sphereNormalsArray.push(c[0], c[1], c[2], 0);
    
    index += 3;
}
