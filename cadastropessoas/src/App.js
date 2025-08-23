import React, { useEffect, useState } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';


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
            <tr key={pessoa.codigo}>
              <td>{pessoa.codigo}</td>
              <td>{pessoa.nome}</td>
              <td>{pessoa.tipoPessoa === 0 ? 'Física' : 'Jurídica'}</td>
              <td>{pessoa.documento}</td>
              <td>{new Date(pessoa.dataNascimento).toLocaleDateString('pt-BR')}</td>
              <td>{pessoa.celular}</td>
              <td>{pessoa.email}</td>
              <td>{pessoa.cep}</td>
              <td>{pessoa.logradouro}</td>
              <td>{pessoa.cidade}</td>
              <td>{pessoa.estado}</td>
              <td>{pessoa.bairro}</td>
              <td>{pessoa.complemento || '-'}</td>
              <td>{pessoa.numero}</td>
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
