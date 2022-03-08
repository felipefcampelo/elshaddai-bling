/*
 * Criação do script para gerar botões 
 * e ações do botão e conexão com API
 * 
 * Utilizando JQuery como biblioteca, pois ja esta inserida no codigo do Bling
 */

/**
 * Cria um estilo para a tabela de informacoes do livro
 */
let styleTable = document.createElement("style");
styleTable.innerHTML = `
    .table-livro-info tbody tr td {
        font-size: 15px;
    }
`;
document.getElementsByTagName("head")[0].appendChild(styleTable);

/**
 * Cria um loader na pagina
 */
let loading = document.createElement('div');
    loading.setAttribute("id", "elshaddai-loading");
    loading.style.position = 'fixed';
    loading.style.top = '50%';
    loading.style.left = '50%';
    loading.style.width = '200px';
    loading.style.height = '200px';
    loading.style.margin = '-100px 0 0 -100px';
    loading.style.display = 'none';
    loading.innerHTML = "<img src='https://github.com/felipefcampelo/elshaddai-bling/raw/master/loading.gif'>";
document.body.append(loading);

/**
 * Variavel global para armazenar os dados do livro
 */
let infoLivro = [];

/**
 * Buscar preco promocional do produto
 * @param {string} codigoProduto 
 */
function buscaPrecoPromocional(codigoProduto) {
    $.ajax({
        url: "https://www.bling.com.br/services/produtos.server.php?f=obterVinculoProdutosMultilojas",
        method: "POST",
        async: false,
        headers: {
            "session-token": $("#sessid").val()
        },
        data: {
            "xajax": "obterVinculoProdutosMultilojas",
            "xajaxargs[]": codigoProduto
        },
        success: function(xmldata) {
            const parser = new DOMParser();
            const xmlText = new XMLSerializer().serializeToString(xmldata);
            const xml = parser.parseFromString(xmlText, "text/xml").documentElement;
            
            $(xml).find("cmd").each(function () {
                let xmlString = $(this).text();
                
                if (xmlString.indexOf("montarTabelaVinculoProdutoLoja") >= 0) {
                    let xmlClean = xmlString.replace("montarTabelaVinculoProdutoLoja(", "");
                        xmlClean = xmlClean.replace(")", "");
                        xmlClean = xmlClean.split(", [[");
                        xmlClean = xmlClean[0];
                    
                    const jsonData = JSON.parse(xmlClean);
                    
                    for (let index = 0; index <= jsonData.length - 1; index++) {
                        if (jsonData[index].nomeLoja == 'Livraria Física El Shaddai') {
                            infoLivro["precoPromocional"] = jsonData[index].precoPromocional;
                        }
                    }
                }
            });
        }
    });
}

/**
 * Buscar dados de estoque do produto
 * @param {string} codigoProduto 
 */
function buscaEstoque(codigoProduto) {
    $.ajax({
        url: "https://www.bling.com.br/services/estoques.server.php?f=listarLancamentos",
        method: "POST",
        async: false,
        headers: {
            "session-token": $("#sessid").val()
        },
        data: {
            "xajax": "listarLancamentos",
            "xajaxargs[]": [
                "ultimos",
                codigoProduto
            ],
            "xajaxs": $("#sessid").val()
        },
        success: function(data) {
            const saldosPorDeposito = data.totais.saldosPorDeposito;
            
            for (let i = 0; i <= saldosPorDeposito.length - 1; i++) {
                // Estoque Geral
                if (saldosPorDeposito[i].descricao == 'Estoque Geral') {
                    let estoqueGeral = String(saldosPorDeposito[i].saldo);
                    
                    if (estoqueGeral.indexOf(".") >= 0) {
                        estoqueGeral = estoqueGeral.split(".");
                        estoqueGeral = estoqueGeral[0];
                    }
                    
                    infoLivro['estoque_geral'] = estoqueGeral;
                }
                
                // Loja Física
                if (saldosPorDeposito[i].descricao == 'Loja Física') {
                    let estoqueLojaFisica = String(saldosPorDeposito[i].saldo);
                    
                    if (estoqueLojaFisica.indexOf(".") >= 0) {
                        estoqueLojaFisica = estoqueLojaFisica.split(".");
                        estoqueLojaFisica = estoqueLojaFisica[0];
                    }
                    
                    infoLivro['estoque_loja_fisica'] = estoqueLojaFisica;
                }
            }
        }
    });
}

/**
 * Busca os dados do produto e monta o modal de informacoes
 * @param {string} codigoProduto 
 */
function getProdutoData(codigoProduto) {
    $("#elshaddai-loading").show();
    
    $.ajax({
        url: "https://www.bling.com.br/services/produtos.server.php?f=obterProduto",
        method: "POST",
        async: true,
        headers: {
            "session-token": $("#sessid").val()
        },
        data: {
            "xajax": "obterProduto",
            "xajaxargs[]": codigoProduto
        },
        success: function(xmldata) {
            const parser = new DOMParser();
            const xmlText = new XMLSerializer().serializeToString(xmldata);
            const xml = parser.parseFromString(xmlText, "text/xml").documentElement;
            
            $(xml).find("cmd").each(function () {
                if ($(this).attr('t') == 'nome') {
                    infoLivro["nome"] = $(this).text();
                }
                
                if ($(this).attr('t') == 'codigo') {
                    infoLivro["codigo"] = $(this).text();
                }
                
                if ($(this).attr('t') == 'preco') {
                    infoLivro["preco"] = $(this).text();
                }
                
                if ($(this).attr('t') == 'imagemURL') {
                    const jsonDataImg = JSON.parse($(this).text());
                    infoLivro["imagem"] = jsonDataImg['imagens'][0];
                }
            });
            
            // Preco Promocional
            buscaPrecoPromocional(codigoProduto);
            
            // Percentual de desconto
            let precoFormatado = infoLivro['preco'].replace(",", ".");
            let precoPromocionalFormatado = infoLivro["precoPromocional"].replace(",", ".");
            const desconto = 100 - (parseFloat(precoPromocionalFormatado) * 100) / parseFloat(precoFormatado);
            infoLivro["desconto"] = Math.round(desconto);
            
            // Estoque
            buscaEstoque(codigoProduto);
            
            // Coloca os dados no modal e exibe
            // Titulo
            $("#info-modal .modal-title").html('');
            $("#info-modal .modal-title").html(infoLivro["nome"]);
            
            // Imagem
            $("#info-modal .livro-imagem").html('');
            $("#info-modal .livro-imagem").html("<img src='" + infoLivro["imagem"] + "' width='100%'>");
            
            // Info
            $("#info-modal .livro-info").html('');
            $("#info-modal .livro-info").html(`
                <table class="table table-bordered table-striped table-livro-info">
                    <tbody>
                        <tr>
                            <td>Código</td>
                            <td>${infoLivro["codigo"]}</td>
                        </tr>
                        <tr>
                            <td>Título</td>
                            <td>${infoLivro["nome"]}</td>
                        </tr>
                        <tr>
                            <td>Preço de capa</td>
                            <td>R$ ${infoLivro["preco"]}</td>
                        </tr>
                        <tr>
                            <td>Preço com desconto</td>
                            <td>R$ ${infoLivro["precoPromocional"]}</td>
                        </tr>
                        <tr>
                            <td>Desconto aplicado</td>
                            <td>${infoLivro["desconto"]}%</td>
                        </tr>
                        <tr>
                            <td>Estoque geral</td>
                            <td>${infoLivro["estoque_geral"]} unidade(s)</td>
                        </tr>
                        <tr>
                            <td>Estoque da loja física</td>
                            <td>${infoLivro["estoque_loja_fisica"]} unidade(s)</td>
                        </tr>
                    </tbody>
                </table>
            `);
            
        }
    });

    setTimeout(function () {
        $("#elshaddai-loading").hide();
        $("#info-modal").modal("show");
    }, 1000);
}

/**
 * Function que cria os botões de +INFO em cada produto
 */
function createButtons() {
    $(".context-menu-item .btn-group").each(function() {
        // Product ID
        const produtoId = $(this).parent().parent().attr("id");
        
        if (produtoId != "" && produtoId != undefined) {
            $(this).append(`
                <button id="btn-details-${produtoId}"
                    onclick="getProdutoData(${produtoId});"
                    class="bling-button call-to-action fas fa-plus info-button"
                    style="width: auto; margin: 3px 10px 3px 0;">
                        <span class="text-add hide-on-minimize">
                            INFO
                        </span>
                </button>
            `);
        }
    });

    // Modal de informação
    const modalHtml = `
        <div class="modal fade" id="info-modal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title" style="font-weight: 700; font-size: 14pt !important;"></h4>
                        <button 
                            type="button" 
                            class="close" 
                            data-dismiss="modal"
                            style="border-radius: 5px; background-color: #777!important; 
                            color: #fff; opacity: 1; position: absolute; right: 17px; 
                            top: 17px; width: 25px !important; height: 25px !important;
                            z-index: 999999 !important;"
                        >
                            &times;
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 mb-4 livro-imagem"></div>
                            <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8 livro-info"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if ($("#info-modal").length == 0) {
        $("#main-container").append(modalHtml);
    }
}

createButtons();

/**
 * Function que fica verificando se houve alguma requisicao AJAX para recarregar os botoes
 */
(function() {
    var proxied = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.send = function() {
        var pointer = this;

        var intervalId = window.setInterval(function() {
            if (pointer.readyState != 4) {
                return;
            }

            if ($(".info-button").length == 0) {
                createButtons(); // Recarrega os botoes
            }

            clearInterval(intervalId);
        }, 1000);

        return proxied.apply(this, [].slice.call(arguments));
    };
})();