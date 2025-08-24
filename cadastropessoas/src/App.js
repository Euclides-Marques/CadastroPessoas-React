import React, { useEffect, useState, useRef } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Button, Spinner, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { PlusCircle, Edit2 as Pencil, Trash2, Search, User, Home as Building, MapPin as MapPinIcon } from 'react-feather';


function App() {
  const tableRef = useRef(null);
  const [resizing, setResizing] = useState({ isResizing: false, columnIndex: null, startX: 0, startWidth: 0 });
  const [columnWidths, setColumnWidths] = useState({});
  const baseUrl = 'https://localhost:7171/Pessoas';
  const baseUrlCreate = 'https://localhost:7171/CreatePessoas';
  const baseUrlUpdate = 'https://localhost:7171/UpdatePessoa';
  const baseUrlDelete = 'https://localhost:7171/DeletePessoa';
  const baseUrlSearchByCodigo = 'https://localhost:7171/PessoasBy';
  const baseUrlSearchByNome = 'https://localhost:7171/PessoasByNome';

  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mostrarModal, setShowModal] = useState(false);
  const [tipoPessoaSelecionado, setTipoPessoaSelecionado] = useState('');
  const [documentoFormatado, setDocumentoFormatado] = useState('');
  const [celularFormatado, setCelularFormatado] = useState('');
  const [cepFormatado, setCepFormatado] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', variant: 'success' });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipoPessoa: '',
    documento: '',
    dataNascimento: '',
    celular: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: ''
  });
  const registrosPorPagina = 5;

  const [isEditing, setIsEditing] = useState(false);
  const [modalTitle, setModalTitle] = useState('Cadastro de Pessoa');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pessoaToDelete, setPessoaToDelete] = useState(null);

  const handleEdit = (pessoa) => {
    const dataNascimento = pessoa.dataNascimento ? new Date(pessoa.dataNascimento).toISOString().split('T')[0] : '';
    
    setFormData({
      codigo: pessoa.codigo,
      nome: pessoa.nome || '',
      tipoPessoa: pessoa.tipoPessoa?.toString() || '',
      documento: pessoa.documento || '',
      dataNascimento: dataNascimento,
      celular: pessoa.celular || '',
      email: pessoa.email || '',
      cep: pessoa.cep || '',
      logradouro: pessoa.logradouro || '',
      numero: pessoa.numero || '',
      bairro: pessoa.bairro || '',
      cidade: pessoa.cidade || '',
      estado: pessoa.estado || '',
      complemento: pessoa.complemento || ''
    });

    setTipoPessoaSelecionado(pessoa.tipoPessoa?.toString() || '');
    setDocumentoFormatado(pessoa.documento ? formatarDocumento(pessoa.documento, pessoa.tipoPessoa) : '');
    setCelularFormatado(pessoa.celular ? formatarCelular(pessoa.celular) : '');
    setCepFormatado(pessoa.cep ? formatarCep(pessoa.cep) : '');
    
    setIsEditing(true);
    setModalTitle('Editar Pessoa');
    setShowModal(true);
  };

  const handleShowModal = () => {
    setIsEditing(false);
    setModalTitle('Cadastro de Pessoa');
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setTipoPessoaSelecionado('');
    setDocumentoFormatado('');
    setCelularFormatado('');
    setCepFormatado('');
    setFormData({
      codigo: '',
      nome: '',
      tipoPessoa: '',
      documento: '',
      dataNascimento: '',
      celular: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: ''
    });
    setIsEditing(false);
  };

  const handleDeleteClick = (pessoa) => {
    setPessoaToDelete(pessoa);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pessoaToDelete) return;
    
    try {
      const response = await axios.delete(`${baseUrlDelete}/${pessoaToDelete.codigo}`);
      
      if (response.status === 200) {
        setNotification({
          show: true,
          message: 'Pessoa excluída com sucesso!',
          variant: 'success'
        });
        
        buscarDados();
        
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Erro ao excluir pessoa. Tente novamente.',
        variant: 'danger'
      });
    } finally {
      setShowDeleteModal(false);
      setPessoaToDelete(null);
    }
  };

  const buscarDados = async (searchTerm = '') => {
    const tempoInicial = Date.now();
    const TEMPO_MINIMO_CARREGAMENTO = 3000;
    setCarregando(true);

    try {
      let url = baseUrl;
      
      if (searchTerm) {
        if (!isNaN(searchTerm)) {
          const response = await axios.get(`${baseUrlSearchByCodigo}/${searchTerm}`);
          setDados(response.data ? [response.data] : []);
        } else {
          const response = await axios.get(`${baseUrlSearchByNome}?nome=${encodeURIComponent(searchTerm)}`);
          setDados(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        const resposta = await axios.get(url);
        setDados(Array.isArray(resposta.data) ? resposta.data : []);
      }
      
      const tempoFinal = Date.now();
      const tempoDecorrido = tempoFinal - tempoInicial;

      if (tempoDecorrido < TEMPO_MINIMO_CARREGAMENTO) {
        await new Promise(resolver => setTimeout(resolver, TEMPO_MINIMO_CARREGAMENTO - tempoDecorrido));
      }
    } catch (erro) {
      setDados([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  const dadosFiltrados = [...dados];

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
    setFormData(prev => ({
      ...prev,
      documento: digitos,
      tipoPessoa: tipoPessoaSelecionado
    }));
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
      if (cepLimpo.length !== 8) {
        alert('CEP deve conter 8 dígitos');
        return;
      }

      setIsSearchingCep(true);

      const resposta = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!resposta.data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: resposta.data.logradouro || '',
          bairro: resposta.data.bairro || '',
          cidade: resposta.data.localidade || '',
          estado: resposta.data.uf || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          logradouro: '',
          bairro: '',
          cidade: '',
          estado: ''
        }));
        setNotification({ show: true, message: 'CEP não encontrado', variant: 'danger' });
        
        setTimeout(() => {
          setNotification({ ...notification, show: false });
        }, 3000);
      }
    } catch (erro) {
      setNotification({ show: true, message: 'Erro ao buscar CEP. Verifique se o CEP está correto e tente novamente.', variant: 'danger' });
      
      setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (e) => {
    const valor = e.target.value;
    const formatado = formatarCep(valor);
    setCepFormatado(formatado);
    setFormData(prev => ({
      ...prev,
      cep: valor.replace(/\D/g, '')
    }));
  };

  const handleCelularChange = (e) => {
    const valor = e.target.value;
    const formatado = formatarCelular(valor);
    setCelularFormatado(formatado);
    setFormData(prev => ({
      ...prev,
      celular: valor.replace(/\D/g, '')
    }));
  };

  const handleTipoPessoaChange = (e) => {
    const novoTipo = e.target.value;
    setTipoPessoaSelecionado(novoTipo);
    setDocumentoFormatado('');
    setFormData(prev => ({
      ...prev,
      tipoPessoa: novoTipo,
      documento: ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    buscarDados(searchInput);
    setPaginaAtual(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const pessoaData = {
        Nome: formData.nome,
        TipoPessoa: parseInt(formData.tipoPessoa, 10),
        Documento: formData.documento,
        DataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : null,
        Celular: formData.celular,
        Email: formData.email,
        Cep: formData.cep,
        Logradouro: formData.logradouro,
        Numero: formData.numero,
        Bairro: formData.bairro,
        Cidade: formData.cidade,
        Estado: formData.estado,
        Complemento: formData.complemento || '',
        Codigo: parseInt(formData.codigo, 10) || 0
      };

      let response;
      
      if (isEditing) {
        response = await axios.put(`${baseUrlUpdate}/${pessoaData.Codigo}`, pessoaData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      } else {
        response = await axios.post(baseUrlCreate, [pessoaData], {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }

      if (response.status === 200 || response.status === 201) {
        setNotification({ 
          show: true, 
          message: isEditing ? 'Pessoa atualizada com sucesso!' : 'Cadastro realizado com sucesso!', 
          variant: 'success' 
        });
        
        handleCloseModal();
        buscarDados();
        
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
          if (isEditing) {
            window.location.reload();
          }
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        alert(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} pessoa: ${error.response.data || 'Verifique os dados e tente novamente.'}`);
      } else {
        alert('Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
    }
  };

  const paginar = (numeroPagina) => setPaginaAtual(numeroPagina);

  // Efeito para lidar com o redimensionamento
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing.isResizing || resizing.columnIndex === null) return;
      
      const table = tableRef.current;
      if (!table) return;
      
      const th = table.querySelectorAll('th')[resizing.columnIndex];
      if (!th) return;
      
      const newWidth = resizing.startWidth + (e.clientX - resizing.startX);
      
      // Atualiza o estado com a nova largura
      setColumnWidths(prev => ({
        ...prev,
        [resizing.columnIndex]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizing({ isResizing: false, columnIndex: null, startX: 0, startWidth: 0 });
    };

    if (resizing.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleResizeStart = (e, index) => {
    const th = e.currentTarget;
    const startX = e.clientX;
    const startWidth = th.offsetWidth;
    
    setResizing({ isResizing: true, columnIndex: index, startX, startWidth });
    th.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeEnd = (e) => {
    if (resizing.isResizing) {
      const th = e.currentTarget;
      th.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  // Função para obter o estilo de largura da coluna
  const getColumnStyle = (index) => {
    if (columnWidths[index]) {
      return { width: `${columnWidths[index]}px`, minWidth: `${columnWidths[index]}px` };
    }
    return {};
  };

  return (
    <Container fluid className="py-2 py-md-3 py-lg-4 px-2 px-md-3">
      {notification.show && (
        <div className="position-fixed top-20 start-50 translate-middle" style={{ zIndex: 9999, minWidth: '300px' }}>
          <Alert 
            variant={notification.variant} 
            onClose={() => setNotification({ ...notification, show: false })} 
            dismissible
          >
            <Alert.Heading>{notification.variant === 'success' ? 'Sucesso!' : 'Erro'}</Alert.Heading>
            <p>{notification.message}</p>
          </Alert>
        </div>
      )}
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
              <Form onSubmit={handleSearch} className="w-100">
                <InputGroup size="sm">
                  <Form.Control
                    placeholder="Buscar pelo código ou pelo nome..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="border-start-0"
                  />
                  <Button 
                    variant="outline-secondary" 
                    type="submit"
                  >
                    <Search size={14} />
                  </Button>
                </InputGroup>
              </Form>
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
              <Table ref={tableRef} hover className="align-middle mb-0" style={{ minWidth: '1200px' }}>
                <thead className="table-light">
                  <tr>
                    <th 
                    className="ps-3" 
                    style={{ minWidth: '50px', ...getColumnStyle(0) }}
                    onMouseDown={(e) => handleResizeStart(e, 0)}
                    onMouseUp={handleResizeEnd}
                  >#</th>
                    <th 
                      style={{ minWidth: '200px', whiteSpace: 'nowrap', ...getColumnStyle(1) }}
                      onMouseDown={(e) => handleResizeStart(e, 1)}
                      onMouseUp={handleResizeEnd}
                    >Nome</th>
                    <th 
                      style={{ minWidth: '100px', whiteSpace: 'nowrap', ...getColumnStyle(2) }}
                      onMouseDown={(e) => handleResizeStart(e, 2)}
                      onMouseUp={handleResizeEnd}
                    >Tipo</th>
                    <th 
                      style={{ minWidth: '150px', whiteSpace: 'nowrap', ...getColumnStyle(3) }}
                      onMouseDown={(e) => handleResizeStart(e, 3)}
                      onMouseUp={handleResizeEnd}
                    >Documento</th>
                    <th 
                      style={{ minWidth: '120px', whiteSpace: 'nowrap', ...getColumnStyle(4) }}
                      onMouseDown={(e) => handleResizeStart(e, 4)}
                      onMouseUp={handleResizeEnd}
                    >Nascimento</th>
                    <th 
                      style={{ minWidth: '120px', whiteSpace: 'nowrap', ...getColumnStyle(5) }}
                      onMouseDown={(e) => handleResizeStart(e, 5)}
                      onMouseUp={handleResizeEnd}
                    >Celular</th>
                    <th 
                      style={{ minWidth: '200px', whiteSpace: 'nowrap', ...getColumnStyle(6) }}
                      onMouseDown={(e) => handleResizeStart(e, 6)}
                      onMouseUp={handleResizeEnd}
                    >Email</th>
                    <th 
                      style={{ minWidth: '100px', whiteSpace: 'nowrap', ...getColumnStyle(7) }}
                      onMouseDown={(e) => handleResizeStart(e, 7)}
                      onMouseUp={handleResizeEnd}
                    >CEP</th>
                    <th 
                      style={{ minWidth: '200px', whiteSpace: 'nowrap', ...getColumnStyle(8) }}
                      onMouseDown={(e) => handleResizeStart(e, 8)}
                      onMouseUp={handleResizeEnd}
                    >Endereço</th>
                    <th 
                      style={{ minWidth: '100px', whiteSpace: 'nowrap', ...getColumnStyle(9) }}
                      onMouseDown={(e) => handleResizeStart(e, 9)}
                      onMouseUp={handleResizeEnd}
                    >Número</th>
                    <th 
                      style={{ minWidth: '150px', whiteSpace: 'nowrap', ...getColumnStyle(10) }}
                      onMouseDown={(e) => handleResizeStart(e, 10)}
                      onMouseUp={handleResizeEnd}
                    >Bairro</th>
                    <th 
                      style={{ minWidth: '150px', whiteSpace: 'nowrap', ...getColumnStyle(11) }}
                      onMouseDown={(e) => handleResizeStart(e, 11)}
                      onMouseUp={handleResizeEnd}
                    >Cidade</th>
                    <th 
                      style={{ minWidth: '80px', whiteSpace: 'nowrap', ...getColumnStyle(12) }}
                      onMouseDown={(e) => handleResizeStart(e, 12)}
                      onMouseUp={handleResizeEnd}
                    >Estado</th>
                    <th 
                      style={{ minWidth: '150px', whiteSpace: 'nowrap', ...getColumnStyle(13) }}
                      onMouseDown={(e) => handleResizeStart(e, 13)}
                      onMouseUp={handleResizeEnd}
                    >Complemento</th>
                    <th 
                      style={{ minWidth: '150px', whiteSpace: 'nowrap', textAlign: 'center', ...getColumnStyle(14) }}
                      onMouseDown={(e) => handleResizeStart(e, 14)}
                      onMouseUp={handleResizeEnd}
                    >Ações</th>
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
                            onClick={() => handleEdit(pessoa)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="px-2"
                            title="Excluir"
                            onClick={() => handleDeleteClick(pessoa)}
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
                    {modalTitle}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                  <Form id="pessoaForm" className="needs-validation" noValidate onSubmit={handleSubmit}>
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
                              type={isEditing ? "text" : "number"}
                              name="codigo"
                              required
                              className={`form-control-lg ${isEditing ? 'bg-light' : ''}`}
                              placeholder="Digite o código"
                              value={formData.codigo}
                              onChange={handleInputChange}
                              readOnly={isEditing}
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
                              name="nome"
                              required
                              className="form-control-lg"
                              placeholder="Digite o nome completo"
                              value={formData.nome}
                              onChange={handleInputChange}
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
                              name="tipoPessoa"
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
                              name="documento"
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
                              name="dataNascimento"
                              className="form-control-lg"
                              value={formData.dataNascimento}
                              onChange={handleInputChange}
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
                              name="celular"
                              className="form-control-lg"
                              placeholder="(00) 00000-0000"
                              value={celularFormatado}
                              onChange={handleCelularChange}
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
                              name="email"
                              className="form-control-lg"
                              placeholder="seu@email.com"
                              value={formData.email}
                              onChange={handleInputChange}
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
                                name="cep"
                                className="form-control-lg"
                                placeholder="00000-000"
                                value={cepFormatado}
                                onChange={handleCepChange}
                                maxLength={9}
                              />
                              <Button
                                variant="outline-secondary"
                                className="d-flex align-items-center"
                                onClick={() => buscarEnderecoPorCep(cepFormatado)}
                                disabled={!cepFormatado || cepFormatado.replace(/\D/g, '').length !== 8}
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
                              name="logradouro"
                              className="form-control-lg"
                              placeholder="Rua, Avenida, etc..."
                              value={formData.logradouro}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              Número
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="numero"
                              className="form-control-lg"
                              placeholder="Número"
                              value={formData.numero}
                              onChange={handleInputChange}
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
                              name="bairro"
                              className="form-control-lg"
                              placeholder="Digite o bairro"
                              value={formData.bairro}
                              onChange={handleInputChange}
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
                              name="cidade"
                              className="form-control-lg"
                              placeholder="Digite a cidade"
                              value={formData.cidade}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">
                              UF
                            </Form.Label>
                            <Form.Select
                              name="estado"
                              className="form-select-lg"
                              value={formData.estado}
                              onChange={handleInputChange}
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
                              name="complemento"
                              rows={2}
                              className="form-control-lg"
                              placeholder="Complemento (opcional)"
                              value={formData.complemento}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light border-top">
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Button variant="secondary" onClick={handleCloseModal}>
                        Cancelar
                      </Button>
                      <Button variant="primary" type="submit" form="pessoaForm">
                        {isEditing ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                </Modal.Footer>
              </Modal>

              {/* Delete Confirmation Modal */}
              <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  Tem certeza que deseja excluir a pessoa <strong>{pessoaToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={handleConfirmDelete}>
                    Confirmar Exclusão
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
