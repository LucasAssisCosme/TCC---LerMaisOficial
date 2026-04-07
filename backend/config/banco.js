const mysql = require("mysql2")
const env = require("./env")

//criar uma variavel para conexão com o banco

const conn= mysql.createConnection({
    host: env.dbHost, 
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword
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
