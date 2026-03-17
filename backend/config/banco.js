const mysql = require("mysql2")

//criar uma variavel para conexão com o banco

const conn= mysql.createConnection({
    host: "localhost", 
    port: "3306",
    database: "sistema_leitura",
    user: "root",
    password: "usbw"
})

//Conectar ao banco de dados, ou tentar pelo menos

conn.connect((erro) => {
     if(erro){
        console.log(erro)
     }
     else{
        console.log("Conectado com sucesso");
     }
})


module.exports = conn