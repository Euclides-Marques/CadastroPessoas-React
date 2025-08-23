import React, { useEffect, useState } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Button, Spinner, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { PlusCircle, Edit2 as Pencil, Trash2, Search, User, Home as Building, MapPin as MapPinIcon } from 'react-feather';


function App() {
  const baseUrl = 'https://localhost:7171/Pessoas';

  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mostrarModal, setShowModal] = useState(false);
  const [tipoPessoaSelecionado, setTipoPessoaSelecionado] = useState('');
  const [documentoFormatado, setDocumentoFormatado] = useState('');
  const [celularFormatado, setCelularFormatado] = useState('');
  const [cepFormatado, setCepFormatado] = useState('');
  const [endereco, setEndereco] = useState({
    logradouro: '',
    bairro: '',
    localidade: '',
    uf: ''
  });
  const registrosPorPagina = 5;

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setTipoPessoaSelecionado('');
    setDocumentoFormatado('');
    setCelularFormatado('');
    setCepFormatado('');
  };

  const buscarDados = async () => {
    const tempoInicial = Date.now();
    const TEMPO_MINIMO_CARREGAMENTO = 3000;

    try {
      const resposta = await axios.get(baseUrl);
      const tempoFinal = Date.now();
      const tempoDecorrido = tempoFinal - tempoInicial;

      if (tempoDecorrido < TEMPO_MINIMO_CARREGAMENTO) {
        await new Promise(resolver => setTimeout(resolver, TEMPO_MINIMO_CARREGAMENTO - tempoDecorrido));
      }

      setDados(resposta.data);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  const dadosFiltrados = dados.filter(pessoa =>
    Object.values(pessoa).some(
      valor => valor &&
        valor.toString().toLowerCase().includes(termoBusca.toLowerCase())
    )
  );

  const indiceUltimoRegistro = paginaAtual * registrosPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosAtuais = dadosFiltrados.slice(indicePrimeiroRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(dadosFiltrados.length / registrosPorPagina);

  const formatarDocumento = (documento, tipo) => {
    if (!documento) return '';

    const digitos = documento.replace(/\D/g, '');

    if (tipo === 0 || tipo === '0') {
      return digitos
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return digitos
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const handleDocumentoChange = (e) => {
    const valor = e.target.value;
    const digitos = valor.replace(/\D/g, '');
    
    const formatado = formatarDocumento(digitos, tipoPessoaSelecionado);
    setDocumentoFormatado(formatado);
  };

  const formatarCelular = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    
    if (digitos.length <= 10) {
      return digitos
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})/, '$1-$2')
        .replace(/(\-\d{4})\d+?$/, '$1');
    } else {
      return digitos
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})/, '$1-$2')
        .replace(/(\-\d{4})\d+?$/, '$1');
    }
  };

  const formatarCep = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 5) {
      return digitos;
    }
    return digitos.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
  };

  const buscarEnderecoPorCep = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;
      
      const resposta = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (!resposta.data.erro) {
        setEndereco({
          logradouro: resposta.data.logradouro || '',
          bairro: resposta.data.bairro || '',
          localidade: resposta.data.localidade || '',
          uf: resposta.data.uf || ''
        });
      } else {
        setEndereco({
          logradouro: '',
          bairro: '',
          localidade: '',
          uf: ''
        });
        alert('CEP não encontrado');
      }
    } catch (erro) {
      console.error('Erro ao buscar CEP:', erro);
      alert('Erro ao buscar CEP. Tente novamente mais tarde.');
    }
  };

  const handleCepChange = (e) => {
    const valor = e.target.value;
    const formatado = formatarCep(valor);
    setCepFormatado(formatado);
  };

  const handleCelularChange = (e) => {
    const valor = e.target.value;
    const formatado = formatarCelular(valor);
    setCelularFormatado(formatado);
  };

  const handleTipoPessoaChange = (e) => {
    const novoTipo = e.target.value;
    setTipoPessoaSelecionado(novoTipo);
    
    setDocumentoFormatado('');
  };

  const paginar = (numeroPagina) => setPaginaAtual(numeroPagina);

  return (
    <Container fluid className="py-2 py-md-3 py-lg-4 px-2 px-md-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-2 py-md-3">
          <Row className="align-items-center g-2">
            <Col xs={12} md={6}>
              <div className="d-flex align-items-center">
                <User size={20} className="d-none d-sm-inline me-2" />
                <h4 className="h5 mb-0">
                  Cadastro de Pessoas
                </h4>
              </div>
            </Col>
            <Col xs={12} md={6} className="mt-2 mt-md-0">
              <div className="d-flex justify-content-center justify-content-md-end">
                <Button variant="primary" size="sm" onClick={handleShowModal}>
                  <PlusCircle size={16} className="me-1" />
                  <span className="d-none d-sm-inline">Nova Pessoa</span>
                  <span className="d-inline d-sm-none">Novo</span>
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-2 p-md-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div style={{ width: '300px' }}>
              <InputGroup size="sm">
                <Form.Control
                  placeholder="Buscar pelo código ou pelo nome..."
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="border-start-0"
                />
                <InputGroup.Text className="bg-light">
                  <Search size={14} />
                </InputGroup.Text>
              </InputGroup>
            </div>
          </div>

          {carregando ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
              <p className="mt-2">Carregando dados...</p>
            </div>
          ) : dadosFiltrados.length === 0 ? (
            <Alert variant="info" className="text-center">
              Nenhum registro encontrado
            </Alert>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table hover className="align-middle mb-0" style={{ minWidth: '1200px' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-3" style={{ minWidth: '50px' }}>#</th>
                    <th style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>Nome</th>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Tipo</th>
                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Documento</th>
                    <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Nascimento</th>
                    <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Celular</th>
                    <th style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>Email</th>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>CEP</th>
                    <th style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>Endereço</th>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Número</th>
                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Bairro</th>
                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Cidade</th>
                    <th style={{ minWidth: '80px', whiteSpace: 'nowrap' }}>Estado</th>
                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Complemento</th>
                    <th style={{ minWidth: '150px', whiteSpace: 'nowrap', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosAtuais.map(pessoa => (
                    <tr key={pessoa.codigo}>
                      <td className="ps-3 fw-bold" style={{ whiteSpace: 'nowrap' }}>{pessoa.codigo}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pessoa.nome}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Badge bg={pessoa.tipoPessoa === 0 ? 'primary' : 'success'} className="text-nowrap">
                          {pessoa.tipoPessoa === 0 ? 'Física' : 'Jurídica'}
                        </Badge>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatarDocumento(pessoa.documento, pessoa.tipoPessoa)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(pessoa.dataNascimento).toLocaleDateString('pt-BR')}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pessoa.celular}</td>
                      <td style={{ whiteSpace: 'nowrap', maxWidth: '200px' }} className="text-truncate" title={pessoa.email}>
                        {pessoa.email}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pessoa.cep}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-truncate" title={pessoa.logradouro}>
                        {pessoa.logradouro}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pessoa.numero}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-truncate" title={pessoa.bairro}>
                        {pessoa.bairro}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-truncate" title={pessoa.cidade}>
                        {pessoa.cidade}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{pessoa.estado}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-truncate" title={pessoa.complemento || ''}>
                        {pessoa.complemento || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="px-2"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="px-2"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Modal
                show={mostrarModal}
                onHide={handleCloseModal}
                size="lg"
                centered
                backdrop="static"
              >
                <Modal.Header closeButton className="bg-light">
                  <Modal.Title className="h5 mb-0">
                    <User size={20} className="me-2" />
                    Cadastro de Pessoa
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                  <Form className="needs-validation" noValidate>
                    <div className="mb-4">
                      <h6 className="text-muted mb-3">
                        <i className="bi bi-person-lines-fill me-2"></i>
                        Dados Pessoais
                      </h6>
                      <Row className="g-3">
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Código
                            </Form.Label>
                            <Form.Control
                              type="number"
                              required
                              className="form-control-lg"
                              placeholder="Digite o código"
                            />
                            <div className="invalid-feedback">
                              Por favor, informe o código.
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Nome Completo
                            </Form.Label>
                            <Form.Control
                              type="text"
                              required
                              className="form-control-lg"
                              placeholder="Digite o nome completo"
                            />
                            <div className="invalid-feedback">
                              Por favor, informe o nome.
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Tipo de Pessoa
                            </Form.Label>
                            <Form.Select
                              required
                              className="form-select-lg"
                              value={tipoPessoaSelecionado}
                              onChange={handleTipoPessoaChange}
                            >
                              <option value="">Selecione o tipo...</option>
                              <option value="0">Pessoa Física</option>
                              <option value="1">Pessoa Jurídica</option>
                            </Form.Select>
                            <div className="invalid-feedback">
                              Por favor, selecione o tipo de pessoa.
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              CPF/CNPJ
                            </Form.Label>
                            <Form.Control
                              type="text"
                              required
                              className="form-control-lg"
                              placeholder={tipoPessoaSelecionado === '0' ? '000.000.000-00' : '00.000.000/0000-00'}
                              value={documentoFormatado}
                              onChange={handleDocumentoChange}
                              maxLength={tipoPessoaSelecionado === '0' ? 14 : 18}
                            />
                            <div className="invalid-feedback">
                              Por favor, informe um CPF ou CNPJ válido.
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Data de Nascimento
                            </Form.Label>
                            <Form.Control
                              type="date"
                              className="form-control-lg"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="mb-4 mt-4 pt-3 border-top">
                      <h6 className="text-muted mb-3">
                        <i className="bi bi-telephone-fill me-2"></i>
                        Contato
                      </h6>
                      <Row className="g-3">
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Celular
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={celularFormatado}
                              onChange={handleCelularChange}
                              placeholder="(00) 00000-0000"
                              className="form-control-lg"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              E-mail
                            </Form.Label>
                            <Form.Control
                              type="email"
                              className="form-control-lg"
                              placeholder="seu@email.com"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="mb-4 mt-4 pt-3 border-top">
                      <h6 className="text-muted mb-3">
                        <i className="bi bi-geo-alt-fill me-2"></i>
                        Endereço
                      </h6>
                      <Row className="g-3">
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              CEP
                            </Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="text"
                                className="form-control-lg"
                                placeholder="00000-000"
                                value={cepFormatado}
                                onChange={handleCepChange}
                              />
                              <Button
                                variant="outline-secondary"
                                className="d-flex align-items-center"
                                onClick={() => buscarEnderecoPorCep(cepFormatado)}
                                disabled={cepFormatado.replace(/\D/g, '').length !== 8}
                                title="Buscar CEP"
                              >
                                <Search size={16} />
                              </Button>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={8}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Logradouro
                            </Form.Label>
                            <Form.Control
                              type="text"
                              className="form-control-lg"
                              placeholder="Rua, Avenida, etc..."
                              value={endereco.logradouro}
                              onChange={(e) => setEndereco({...endereco, logradouro: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Número
                            </Form.Label>
                            <Form.Control
                              type="number"
                              className="form-control-lg"
                              placeholder="Nº"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={5}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Bairro
                            </Form.Label>
                            <Form.Control
                              type="text"
                              className="form-control-lg"
                              value={endereco.bairro}
                              onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
                              placeholder="Digite o bairro"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Cidade
                            </Form.Label>
                            <Form.Control
                              type="text"
                              className="form-control-lg"
                              value={endereco.localidade}
                              onChange={(e) => setEndereco({...endereco, localidade: e.target.value})}
                              placeholder="Digite a cidade"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              UF
                            </Form.Label>
                            <Form.Select 
                              className="form-select-lg"
                              value={endereco.uf}
                              onChange={(e) => setEndereco({...endereco, uf: e.target.value})}
                            >
                              <option value="">UF</option>
                              {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Complemento
                              <span className="text-muted small"> (Opcional)</span>
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              className="form-control-lg"
                              placeholder="Apartamento, bloco, andar, etc..."
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light border-top">
                  <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleCloseModal}
                    className="px-4"
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    className="px-4"
                  >
                    <i className="bi bi-check-lg me-2"></i>
                    Salvar Cadastro
                  </Button>
                </Modal.Footer>
              </Modal>

            </div>
          )}
        </Card.Body>

        <Card.Footer className="bg-white py-2">
          <Row className="align-items-center g-2">
            <Col xs={12} md={6}>
              <small className="text-muted">
                Mostrando <strong>{Math.min(indiceUltimoRegistro, dadosFiltrados.length)}</strong> de <strong>{dadosFiltrados.length}</strong> registro{dadosFiltrados.length !== 1 ? 's' : ''}
              </small>
            </Col>
            <Col xs={12} md={6}>
              <div className="d-flex justify-content-center justify-content-md-end">
                <div className="btn-group" role="group">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    if (totalPaginas <= 5) return i + 1;
                    if (paginaAtual <= 3) return i + 1;
                    if (paginaAtual >= totalPaginas - 2) return totalPaginas - 4 + i;
                    return paginaAtual - 2 + i;
                  }).filter((pagina, indice, array) => array.indexOf(pagina) === indice && pagina > 0 && pagina <= totalPaginas)
                    .map(numero => (
                      <Button
                        key={numero}
                        variant={paginaAtual === numero ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => paginar(numero)}
                        className={paginaAtual === numero ? 'active' : ''}
                      >
                        {numero}
                      </Button>
                    ))}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default App;
