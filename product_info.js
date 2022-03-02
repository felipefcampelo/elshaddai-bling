// Monta o código JQuery
// (Estou usando JQuery que já está inserido no código nativo do Bling)

/**
 * Busca os dados do produto em uma requisição de imitação do modo como o Blig requisita
 * os dados de um produto
 * @param {string} codigoProduto 
 */
function getProdutoData(codigoProduto) {
    $.ajax({
        url: "https://www.bling.com.br/services/produtos.server.php?f=obterProduto",
        method: "POST",
        headers: {
            "Origin": "https://www.bling.com.br",
            "Referer": "https://www.bling.com.br/produtos.php",
            "session-token": $("#sessid").val(),
            "User-Agent": "navigator.userAgent",
            "Cookie": document.cookie
        },
        data: {
        xajax: "obterProduto",
            "xajaxargs[]": codigoProduto
        },
        success: function(response) {
            console.log(response); // xml
        }
    });

    $("#info-modal").modal("show");
}

/**
 * Function que cria os botões de +INFO em cada produto
 */
function createButtons() {
    $(".context-menu-item .btn-group").each(function() {
        // Product ID
        const produtoId = $(this).parent().parent().attr("id");
        //const codigoProduto = $("#" + produtoId).find('td span:contains("Código")').next().html();

        if (produtoId != "" && produtoId != undefined) {
            $(this).append(
                `<button id="btn-details-${produtoId}"
                        onclick="getProdutoData(${produtoId});"
                        class="bling-button call-to-action fas fa-plus info-button"
                        style="width: auto; margin: 3px 10px 3px 0;">
                            <span class="text-add hide-on-minimize">
                                INFO
                            </span>
                </button>`
            );
        }
    });

    // Modal de informação
    const modalHtml = `
        <div class="modal fade" id="info-modal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nome do produto</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ...
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
 * Functino que fica verificando se houve alguma requisicao AJAX para recarregar os botoes
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
