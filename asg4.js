// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`


// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform bool u_lightOn;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  void main() {
    if (u_whichTexture == -3){
        gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
    } else if(u_whichTexture == -2){
        gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1){
        gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0){
        gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1){
        gl_FragColor = texture2D(u_Sampler1,v_UV);
    } else if (u_whichTexture == 2){
        gl_FragColor = texture2D(u_Sampler2,v_UV);
    } else{
        gl_FragColor = vec4(1,.2,.2,1);
    }

    vec3 lightVector = u_lightPos-vec3(v_VertPos);

    float r=length(lightVector);
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L),0.0);

    vec3 R = reflect(-L,N);
    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

    float specular = pow(max(dot(E,R),0.0),64.0) * .8;
    vec3 diffuse = vec3(gl_FragColor) * nDotL * .7;
    vec3 ambient = vec3(gl_FragColor) * 0.2;
    if(u_lightOn){
        if(u_whichTexture == 1){
            gl_FragColor = vec4(specular+diffuse+ambient,1.0);
        }else{
            gl_FragColor = vec4(diffuse+ambient,1.0);
        }
    }
  }`

// Global Vars
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_Size;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let u_lightPos;
let u_lightOn;
let u_cameraPos;

let g_normalOn = false;
let g_lightOn = true;
let g_lightPos = [0,1,-2];

function addActionsForHtmlUI(){
    document.getElementById('normalOn').onclick = function(){g_normalOn = true;};
    document.getElementById('normalOff').onclick = function(){g_normalOn = false;};

    document.getElementById('lightOn').onclick = function(){g_lightOn = true;};
    document.getElementById('lightOff').onclick = function(){g_lightOn = false;};
    //WTF GITHUB
    
    document.getElementById('LightY').addEventListener('mousemove',function(ev){if(ev.buttons == 1){g_lightPos[1] = this.value/100; renderAllShapes();}});
    document.getElementById('LightZ').addEventListener('mousemove',function(ev){if(ev.buttons == 1){g_lightPos[2] = this.value/100; renderAllShapes();}});
}


// Classes //

/*
                POINT
*/

class Point{
    constructor(){
        this.type = "point";
        this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        this.size = 5.0;
    }

    render() {
        var xy = this.position
        var rgba = this.color;
        var size = this.size;
        
        gl.disableVertexAttribArray(a_Position);
        // Pass the position of a point to a_Position variable
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Pass the size of a point to u_Size variable
        gl.uniform1f(u_Size,size);

        // Draw
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}


/*
                    TRIANGLES
*/


class Triangle{
    constructor(){
        this.type="triangle"
        this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        this.size = 5.0;
    }

    render(){
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

               // Pass the color of a point to u_FragColor variable
               gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
               // Pass the size of a point to u_Size variable
               gl.uniform1f(u_Size,size);
       
               // Draw
               var d = this.size/200.0
               drawTriangle( [xy[0]-d,xy[1],xy[0]+d,xy[1],xy[0],xy[1]+2*d])
    }
}

// Draws a Triangle //

function drawTriangle(vertices){
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log("Failed to ceate the buffer object");
        return -1
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW)


    gl.vertexAttribPointer(a_Position,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES,0,n);
}

// Draws a 3D Triangle //

function drawTriangle3D(vertices){
    var n = vertices.length/3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log("Failed to ceate the buffer object");
        return -1
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW)


    gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.TRIANGLES,0,n);
}

// Draws a UV of 3D Triangle //
function drawTriangle3DUVNormal(vertices,uv,normals){
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log("Failed to ceate the buffer object");
        return -1
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW)


    gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(a_Position);

    // Creating buffer for UV object
    var uvBuffer = gl.createBuffer();
    if(!uvBuffer){
        console.log("Failed to create the buffer object");
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_UV,2,gl.FLOAT,false,0,0);
    
    gl.enableVertexAttribArray(a_UV);

    // Creating buffer for Normal object
    var normalBuffer = gl.createBuffer();
    if(!normalBuffer){
        console.log("Failed to create the buffer object");
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Normal,3,gl.FLOAT,false,0,0);
    
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES,0,n);

}

/*
                    CIRCLES
*/

class Circle{
    constructor(){
        this.type = "circle";
        this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        this.size = 5.0;
        this.segments = g_segmentCount;
    }

    render(){
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Draw
        
        var d = this.size/200.0
               
        let angleStep = 360/this.segments;
            for(var angle = 0; angle < 360; angle=angle+angleStep){
                let centerPt = [xy[0],xy[1]];
                let angle1=angle;
                let angle2=angle+angleStep;
                let vec1=[Math.cos(angle1*Math.PI/180)*d,Math.sin(angle1*Math.PI/180)*d]
                let vec2=[Math.cos(angle2*Math.PI/180)*d,Math.sin(angle2*Math.PI/180)*d]
                let pt1 = [centerPt[0]+vec1[0],centerPt[1]+vec1[1]];
                let pt2 = [centerPt[0]+vec2[0],centerPt[1]+vec2[1]];
            
                drawTriangle( [xy[0],xy[1],pt1[0],pt1[1],pt2[0],pt2[1]])
            }

               
    }
}

/*
                    SPHERE
*/

class Sphere{
    constructor(){
        this.type = 'sphere';
        this.color = [1.0,1.0,1.0,1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
        this.verts32 = new Float32Array([]);
    }
    render(){
        var rgba = this.color;

        gl.uniform1i(u_whichTexture,this.textureNum);
        gl.uniform4f(u_FragColor,rgba[0],rgba[1],rgba[2],rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix,false,this.matrix.elements);

        var d = Math.PI/10;
        var dd = Math.PI/10;

        for(var t=0;t<Math.PI;t+=d){
            for(var r=0;r<(2*Math.PI);r+=d){
                var p1 = [Math.sin(t)*Math.cos(r),Math.sin(t)*Math.sin(r),Math.cos(t)];

                var p2 = [Math.sin(t+dd)*Math.cos(r),Math.sin(t+dd)*Math.sin(r),Math.cos(t+dd)];
                var p3 = [Math.sin(t)*Math.cos(r+dd),Math.sin(t)*Math.sin(r+dd),Math.cos(t)];
                var p4 = [Math.sin(t+dd)*Math.cos(r+dd),Math.sin(t+dd)*Math.sin(r+dd),Math.cos(t+dd)];

                var v = [];
                var uv = [];
                v = v.concat(p1); uv = uv.concat([0,0]);
                v = v.concat(p2); uv = uv.concat([0,0]);
                v = v.concat(p4); uv = uv.concat([0,0]);
                
                gl.uniform4f(u_FragColor,1,1,1,1);
                drawTriangle3DUVNormal(v,uv,v);

                v=[]; uv=[];
                v = v.concat(p1); uv = uv.concat([0,0]);
                v = v.concat(p4); uv = uv.concat([0,0]);
                v = v.concat(p3); uv = uv.concat([0,0]);
                gl.uniform4f(u_FragColor,1,0,1,1);
                drawTriangle3DUVNormal(v,uv,v);

            }
        }
    }
}


/*
                    CUBES
*/

class Cube{
    constructor(){
        this.type = "cube";;
        this.color = [1.0,1.0,1.0,1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }

    render(){
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;

        gl.uniform1i(u_whichTexture,this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix,false,this.matrix.elements);

        // Front

        drawTriangle3DUVNormal([0,0,0 , 1,1,0, 1,0,0], [0,0, 1,1, 1,0],[0,0,-1,0,0,-1,0,0,-1]);
        drawTriangle3DUVNormal([0,0,0 , 0,1,0, 1,1,0], [0,0, 0,1, 1,1],[0,0,-1,0,0,-1,0,0,-1]);

        // Back

        drawTriangle3DUVNormal([0.0,1.0,1.0, 0.0,0.0,1.0, 1.0,1.0,1.0], [0,1, 0,0, 1,1],[0,0,1,0,0,1,0,0,1]);
        drawTriangle3DUVNormal([1.0,0.0,1.0, 0.0,0.0,1.0, 1.0,1.0,1.0], [1,0, 0,0, 1,1],[0,0,1,0,0,1,0,0,1]);

        // Top

        drawTriangle3DUVNormal([0.0,1.0,0.0, 0.0,1.0,1.0, 1.0,1.0,1.0],[0,0, 0,1, 1,1],[0,1,0,0,1,0,0,1,0]);
        drawTriangle3DUVNormal([0.0,1.0,0.0, 1.0,1.0,1.0, 1.0,1.0,0.0],[0,0, 1,1, 1,0],[0,1,0,0,1,0,0,1,0]);

        // Bottom

        drawTriangle3DUVNormal([1.0,0.0,1.0, 0.0,0.0,0.0, 0.0,0.0,1.0],[1,0, 0,0, 0,0],[0,-1,0,0,-1,0,0,-1,0]);
        drawTriangle3DUVNormal([1.0,0.0,1.0, 0.0,0.0,0.0, 1.0,0.0,0.0],[1,0, 0,0, 1,0],[0,-1,0,0,-1,0,0,-1,0]);

        // Right

        drawTriangle3DUVNormal([1.0,1.0,1.0, 1.0,0.0,1.0, 1.0,1.0,0.0],[1,1, 0,1, 1,0],[1,0,0,1,0,0,1,0,0]);
        drawTriangle3DUVNormal([1.0,0.0,0.0, 1.0,0.0,1.0, 1.0,1.0,0.0],[0,0, 0,1, 1,0],[1,0,0,1,0,0,1,0,0]);

        // Left

        drawTriangle3DUVNormal([0.0,0.0,0.0, 0.0,0.0,1.0, 0.0,1.0,0.0],[0,0, 0,1, 1,0],[-1,0,0,-1,0,0,-1,0,0]);
        drawTriangle3DUVNormal([0.0,1.0,1.0, 0.0,1.0,0.0, 0.0,0.0,1.0],[1,1, 1,0, 0,1],[-1,0,0,-1,0,0,-1,0,0]);
    }
}

// My second "primitive shape"
class Pyramid{
    constructor(){
        this.type = "pyramid";
        //this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        //this.size = 5.0;
        //this.segments = g_segmentCount;
        this.matrix = new Matrix4();
    }

    render(){
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix,false,this.matrix.elements);
        
        drawTriangle3D([0.0,0.0,0.0, 1.0,0.0,0.0, 0.0,0.0,1.0]);
        drawTriangle3D([1.0,0.0,1.0, 1.0,0.0,0.0, 0.0,0.0,1.0]);
        
        gl.uniform4f(u_FragColor,rgba[0]*.9,rgba[1]*.9,rgba[2]*.9,rgba[3]);
        drawTriangle3D([0.0,0.0,0.0, 1.0,0.0,0.0, 0.5,1,.5]);

        gl.uniform4f(u_FragColor,rgba[0]*.8,rgba[1]*.8,rgba[2]*.8,rgba[3]);
        drawTriangle3D([1.0,0.0,0.0, 1.0,0.0,1.0, 0.5,1,.5]);
        
        gl.uniform4f(u_FragColor,rgba[0]*.7,rgba[1]*.7,rgba[2]*.7,rgba[3]);
        drawTriangle3D([0.0,0.0,0.0, 0.0,0.0,1.0, 0.5,1,.5]);

        gl.uniform4f(u_FragColor,rgba[0]*.6,rgba[1]*.6,rgba[2]*.6,rgba[3]);
        drawTriangle3D([0.0,0.0,1.0, 1.0,0.0,1.0, 0.5,1,.5]);



    }
}

// Camera Stuff //

function cross(other1, other2) {
    // This function should create and return a new vector.
    let v3 = new Vector3(); // Modify this line to calculate cross product between other1 and other2.
  
    v3.elements[0] = ((other1.elements[1]*other2.elements[2]) - (other1.elements[2]*other2.elements[1]))
    v3.elements[1] = -((other1.elements[0]*other2.elements[2]) - (other1.elements[2]*other2.elements[0]))
    v3.elements[2] = ((other1.elements[0]*other2.elements[1]) - (other1.elements[1]*other2.elements[0]))
  
    return v3;
  }

class Camera{
    constructor(){
        this.eye = new Vector3([0,0,0]);
        this.at = new Vector3([0,0,1]);
        this.up = new Vector3([0,1,0]);
        this.fov = 60;
        this.speed = .1;
        this.alpha = 15
    }
    moveForward(){
        let f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        f = f.normalize();
        f = f.mul(this.speed);
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);

    }
    moveBack(){
        let b = new Vector3();
        b = b.set(this.eye);
        b = b.sub(this.at);
        b = b.normalize();
        b = b.mul(this.speed);
        this.eye = this.eye.add(b);
        this.at = this.at.add(b);
    }
    moveLeft(){
        let f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        let s = cross(this.up,f);
        s = s.normalize();
        s = s.mul(this.speed);
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }
    moveRight(){
        let f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        let s = cross(f,this.up);
        s = s.normalize();
        s = s.mul(this.speed);
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }
    panLeft(){
        let f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        var rotateMatLeft = new Matrix4();
        rotateMatLeft.setRotate(this.alpha,this.up.elements[0],this.up.elements[1],this.up.elements[2]);
        var f_prime = rotateMatLeft.multiplyVector3(f);
        this.at = this.at.set(this.eye);
        this.at = this.at.add(f_prime);
        angle-=15
    }
    panRight(){
        let f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        var rotateMatLeft = new Matrix4();
        rotateMatLeft.setRotate(-this.alpha,this.up.elements[0],this.up.elements[1],this.up.elements[2]);
        var f_prime = rotateMatLeft.multiplyVector3(f);
        this.at = this.at.set(this.eye);
        this.at = this.at.add(f_prime);
        angle+=15
    }
    getPosition(){
        sendTextToHTML(Math.floor(this.eye.elements[0]+20) + "," + Math.floor(this.eye.elements[2]+20) + " angle : " + Math.abs(Math.floor(angle)),"player");
        return [Math.floor(this.eye.elements[0]+20),Math.floor(this.eye.elements[2]+20)]
    }
}

var g_camera = new Camera();

function keydown(){
    document.addEventListener('keypress',function(event){
        switch(event.keyCode){
            case 119:
                g_camera.moveForward();
                break;
            case 115:
                g_camera.moveBack();
                break;    
            case 97:
                g_camera.moveLeft();
                break;
            case 100:
                g_camera.moveRight();
                break;
            case 113:
                g_camera.panLeft();
                break;
            case 101:
                g_camera.panRight();
                break;
            case 114:
                var playerPos = g_camera.getPosition()
                g_map[playerPos[0]][playerPos[1]] = 1
                break;
            case 102:
                var playerPos = g_camera.getPosition()
                g_map[playerPos[0]][playerPos[1]] = 0
                console.log("here")
                break;
            default:
                console.log(event.keyCode);
                break;
        }
    });
}


let mousePos = [0,0];
let deltaPos = [0,0];
let prevPos = [0,0];
let angle = 0

function mouseLook(event){
    document.addEventListener('mousemove',function(event){
        mousePos[0] = event.x;
        mousePos[1] = event.y;

        deltaPos[0] = mousePos[0] - prevPos[0];
        
        angle += deltaPos[0];
        angle = angle % 360

        let f = new Vector3();
        f = f.set(g_camera.at);
        f = f.sub(g_camera.eye);
        var rotateMatLeft = new Matrix4();
        rotateMatLeft.setRotate(-deltaPos[0],g_camera.up.elements[0],g_camera.up.elements[1],g_camera.up.elements[2]);
        var f_prime = rotateMatLeft.multiplyVector3(f);
        g_camera.at = g_camera.at.set(g_camera.eye);
        g_camera.at = g_camera.at.add(f_prime);

        prevPos[0] = mousePos[0];




    });

}

// Map //

// UV and Texturing //

function initTextures(gl, n){
    // Get the storage location of the u_Sampler
    var image0 = new Image(); // Create an image object
    var image1 = new Image();
    var image2 = new Image();

    var texture0 = gl.createTexture(); // Create a texture object
    var texture1 = gl.createTexture(); // Create a texture object
    var texture2 = gl.createTexture();

    image0.onload = function(){ sendTextureToGLSL(texture0, u_Sampler0, image0, 0); };
    image0.src = "grass.jpg";

    image1.onload = function(){ sendTextureToGLSL(texture1, u_Sampler1, image1, 1); };
    image1.src = "sky.png";

    image2.onload = function(){ sendTextureToGLSL(texture2, u_Sampler2, image2, 2); }
    image2.src = "cobble.png";

    return true;
}


function sendTextureToGLSL(texture,u_Sampler,image,texUnit){
    console.log(texUnit)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
    
    if(texUnit == 0){
        gl.activeTexture(gl.TEXTURE0);
    } else if(texUnit == 1){
        gl.activeTexture(gl.TEXTURE1);
    } else if(texUnit == 2){
        gl.activeTexture(gl.TEXTURE2);
    }
    
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    gl.uniform1i(u_Sampler,texUnit);

    console.log("Finished load_texture");
}



// WEBGL SETUP & MAIN //

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById("asg4");

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
      }

      // // Get the storage location of a_Position
      a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
      }

      a_UV = gl.getAttribLocation(gl.program, 'a_UV');
      if (a_UV < 0){
        console.log("Failed to get the storage location of a_UV");
        return;
      }

      a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
      if (a_Normal < 0){
        console.log("Failed to get the storage location of a_Normal");
        return;
      }
    
      // Get the storage location of u_FragColor
      u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
      if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
      }

    // Get the storage location of u_FragColor
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log('Failed to get the storage location of u_lightPos');
        return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log('Failed to get the storage location of u_lightOn');
        return;
    }

     u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
     if (!u_cameraPos) {
         console.log('Failed to get the storage location of u_cameraPos');
         return;
     }

      u_ProjectionMatrix = gl.getUniformLocation(gl.program,'u_ProjectionMatrix');
      if (!u_ProjectionMatrix) {
        console.log("Failed to get the storage location of u_ProjectionMatrix");
        return;
      }

      u_ViewMatrix = gl.getUniformLocation(gl.program,'u_ViewMatrix');
      if (!u_ViewMatrix) {
        console.log("Failed to get the storage location of u_ViewMatrix");
        return;
      }

      u_whichTexture = gl.getUniformLocation(gl.program,'u_whichTexture');
      if (!u_whichTexture) {
        console.log("Failed to get the storage location of u_whichTexture");
        return;
      }

      // Textures

      u_Sampler0 = gl.getUniformLocation(gl.program,'u_Sampler0');
      if (!u_Sampler0) {
        console.log("Failed to get the storage location of u_Sampler0");
        return;
      }

      u_Sampler1 = gl.getUniformLocation(gl.program,'u_Sampler1');
      if (!u_Sampler1) {
        console.log("Failed to get the storage location of u_Sampler1");
        return;
      }

      u_Sampler2 = gl.getUniformLocation(gl.program,'u_Sampler2');
      if (!u_Sampler2) {
        console.log("Failed to get the storage location of u_Sampler2");
        return;
      }

      //---------

      u_ModelMatrix = gl.getUniformLocation(gl.program,'u_ModelMatrix');
      if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
        return;
      }

      u_GlobalRotateMatrix = gl.getUniformLocation(gl.program,'u_GlobalRotateMatrix');
      if (!u_GlobalRotateMatrix) {
        console.log("Failed to get the storage location of u_GlobalRotateMatrix");
        return;
      }


      var identityM = new Matrix4();
      gl.uniformMatrix4fv(u_ModelMatrix,false,identityM.elements);

}

function convertCoordinatesEventToGL(ev){

    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderGnome(){
    var body = new Cube();
    body.color = [1.0,0.0,0.0,1.0];
    body.matrix.translate(-.25,-.3,1.5);
    body.matrix.rotate(0,1,0,0)
    body.matrix.rotate(-g_bodyAngle,1,0,0)
    var bodyCoords = new Matrix4(body.matrix);
    body.matrix.scale(.5,.6,.3);
    body.render(); 

    var arm2 = new Cube();
    arm2.color = [0.5,0.0,0.0,1.0];
    arm2.matrix = new Matrix4(bodyCoords);
    arm2.matrix.translate(.6,0,.05)
    arm2.matrix.rotate(180,0,0,1)
    arm2.matrix.rotate(180,0,1,0)
    arm2.matrix.translate(-.1,-.6,-.2)
    arm2.matrix.rotate(-g_armAngle,0,0,1)
    var arm2Coords = new Matrix4(arm2.matrix)
    arm2.matrix.scale(.2,.6,.2);
    arm2.render();

    var hand1 = new Cube();
    hand1.color = [1.0,1.0,0.0,1.0];
    hand1.matrix = new Matrix4(arm2Coords);
    hand1.matrix.scale(.15,.15,.05)
    hand1.matrix.translate(0,4,1.5);
    hand1.matrix.rotate(-g_handAngle,0,0,1)
    hand1.render();

    var hand2 = new Cube();
    hand2.color = [1.0,1.0,0.0,1.0];
    hand2.matrix = new Matrix4(bodyCoords);
    hand2.matrix.scale(.15,.15,.05)
    hand2.matrix.translate(-1,-1,2);
    hand2.render();

    var arm3 = new Cube();
    arm2.color = [0.5,0.0,0.0,1.0];
    arm2.matrix = new Matrix4(bodyCoords);
    arm2.matrix.translate(-.2,0,.05)
    arm2.matrix.scale(.2,.6,.2);
    arm2.render();

    var leg1 = new Cube();
    leg1.color = [0.0,0.0,.5,1.0];
    leg1.matrix.translate(.05,-.9,1.55)
    leg1.matrix.scale(.2,.6,.2);
    leg1.render();

    var leg2 = new Cube();
    leg2.color = [0.0,0.0,.5,1.0];
    leg2.matrix.translate(-.25,-.9,1.55)
    leg2.matrix.scale(.2,.6,.2);
    leg2.render();



    // Head //

    var head = new Cube();
    head.color = [1.0,1.0,0.0,1.0];
    head.matrix = bodyCoords;
    head.matrix.translate(.1,.6,0);
    head.matrix.rotate(-g_headAngle,1,0,0);
    var headCoords = new Matrix4(head.matrix);
    head.matrix.scale(.3,.3,.3);
    head.render(); 

    var hat = new Pyramid();
    hat.color = [1,0,0,1];
    hat.matrix = new Matrix4(headCoords);
    hat.matrix.translate(0,.3,0)
    hat.matrix.scale(.3,.3,.3);
    hat.matrix.translate(0,g_hatTranslate,0)
    hat.render();

    var eye1 = new Cube();
    eye1.color = [.3,.3,.3,1];
    eye1.matrix = new Matrix4(headCoords);
    eye1.matrix.translate(0,.15,-.05)
    eye1.matrix.scale(.12,.1,.05);
    eye1.render();

    var eye2 = new Cube();
    eye2.color = [.3,.3,.3,1];
    eye2.matrix = new Matrix4(headCoords);
    eye2.matrix.translate(.18,.15,-.05)
    eye2.matrix.scale(.12,.1,.05);
    eye2.render();

    var eye3 = new Cube();
    eye3.color = [.3,.3,.3,1];
    eye3.matrix = new Matrix4(headCoords);
    eye3.matrix.translate(0.1,.2,-.05)
    eye3.matrix.scale(.12,.05,.05);
    eye3.render();
}

function renderAllShapes(){
    var startTime = performance.now();

    
    var projMat = new Matrix4();
    projMat.setPerspective(g_camera.fov,canvas.width/canvas.height,.1,1000);
    gl.uniformMatrix4fv(u_ProjectionMatrix,false,projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix,false,viewMat.elements);
    

    var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
    console.log(g_globalAngle);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix,false,globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform3f(u_lightPos,g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    gl.uniform3f(u_cameraPos,g_camera.eye.elements[0],g_camera.eye.elements[1],g_camera.eye.elements[2]);

    gl.uniform1i(u_lightOn,g_lightOn);


    var light=new Cube();
    light.color = [2,2,0,1];
    light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    light.matrix.scale(.1,.1,.1);
    light.matrix.translate(-.5,-.5,-.5);
    light.render();

    var ground = new Cube();
    ground.color = [1,0,0,1];
    if(g_normalOn) ground.textureNum = -3;
    ground.matrix.translate(0,-.75,0);
    ground.matrix.scale(10,.01,10)
    ground.matrix.translate(-.5,0,-.5);
    ground.render();

    var sky = new Cube();
    sky.color = [1,1,1,1];
    if(g_normalOn) sky.textureNum = -3;
    sky.matrix.scale(10,10,10);
    sky.matrix.translate(-.5,-.5,-.5);
    sky.render();

    var sphere = new Sphere();
    sphere.textureNum = 1;
    if(g_normalOn) sphere.textureNum = -3;
    sphere.matrix.translate(-2,.5,2);
    sphere.render();

    var cube = new Cube();
    cube.textureNum = 1;
    if(g_normalOn) cube.textureNum = -3;
    cube.matrix.translate(2,.5,2);
    cube.render();


    renderGnome();

    //////////////////////////////////////////////////////////


    var duration = performance.now() - startTime;
    sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");

}

function sendTextToHTML(text,htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables
let g_globalAngle = 0;
let g_bodyAngle = 0;
let g_headAngle = 0;
let g_armAngle = 0;
let g_handAngle = 0;
let animation = true;
let g_hatTranslate = 0


function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI()
    initTextures(gl,0);
    keydown();
    //mouseLook();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0
var g_seconds=performance.now()/1000.0-g_startTime;
var timer = 0;

function tick() {

    g_seconds=performance.now()/1000-g_startTime;

    canvas.onmousedown = function(ev){
        if(ev.buttons){
            console.log(ev.clientX);
            g_globalAngle.x = ev.clientX;
            g_globalAngle.y = ev.clientY;
        }
    }


    updateAnimationAngles();
    canvas.onmousedown = function(ev){
        if((ev.shiftKey && ev.buttons)){
            g_hatTranslate = Math.abs(Math.sin(g_seconds - timer))
            timer = g_seconds;
            console.log(timer)
        }
    }

    if(g_hatTranslate != 0 && (g_seconds - timer < 3)){
        g_hatTranslate = Math.abs(Math.sin(g_seconds - timer))
    }else{
        g_hatTranslate = 0;
    }


    renderAllShapes();
    requestAnimationFrame(tick);
}

function updateAnimationAngles(){
    if(animation){
        g_bodyAngle = 45*Math.sin(g_seconds*10);
        g_armAngle = Math.abs(-30*Math.sin(g_seconds));
        g_headAngle = Math.abs(45*Math.sin(g_seconds*5));
    }
    g_lightPos[0]=Math.cos(g_seconds);
}

