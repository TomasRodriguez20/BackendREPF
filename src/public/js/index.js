const socket = io();
socket.emit('message', 'Hola, me estoy comunicando desde un websocket!')
Swal.fire({
    title: "Hola, Coders", 
    text:'Alerta basica con Sweetalert', 
    icon: "success"
})