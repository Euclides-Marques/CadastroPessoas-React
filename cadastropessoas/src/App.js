import React, { useEffect, useState } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import logoCadastro from './assets';

function App() {
  const baseUrl = 'https://localhost:7171/Pessoas';

  const [data, setData] = useState([]);

  const pedidoGet = async () => {
    await axios.get(baseUrl)
      .then(response => {
        setData(response.data);
      }).catch(error => {
        console.log(error);
      })
  }

  useEffect(() => {
    pedidoGet();
  })

  return (
    <div className="App">
      <br />
      <h3>Cadatro de Pessoas</h3>
      <header>
        <img src={logo} alt="Cadastro"></img>
        <button className="btn btn-success">Incluir nova pessoa</button>
      </header>
      <table className="table table-borded">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Tipo Pessoa</th>
            <th>Documento</th>
            <th>Data Nascimento</th>
            <th>Celular</th>
            <th>Email</th>
            <th>Cep</th>
            <th>Logradouro</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>Bairro</th>
            <th>Complemento</th>
            <th>Número</th>
          </tr>
        </thead>
        <tbody>
          {data.map(pessoa => (
            <tr key={pessoa.Codigo}>
              <td>{pessoa.Codigo}</td>
              <td>{pessoa.Nome}</td>
              <td>{pessoa.TipoPessoa}</td>
              <td>{pessoa.Documento}</td>
              <td>{pessoa.DataNascimento}</td>
              <td>{pessoa.Celular}</td>
              <td>{pessoa.Email}</td>
              <td>{pessoa.Cep}</td>
              <td>{pessoa.Logradouro}</td>
              <td>{pessoa.Cidade}</td>
              <td>{pessoa.Estado}</td>
              <td>{pessoa.Bairro}</td>
              <td>{pessoa.Complemento}</td>
              <td>{pessoa.Numero}</td>
              <td>
                <button className="btn btn-primary">Editar</button> {"  "}
                <button className="btn btn-danger">Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
