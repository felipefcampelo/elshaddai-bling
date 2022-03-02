// Monta o código JQuery
// (Estou usando JQuery que já está inserido no código nativo do Bling)

/**
 * Converte XML em JSON
 * @param {*} 
 */
 function xmlToJson(xml) {
	// Create the return object
	var obj = {};

	// if (xml.nodeType == 1) { // element
		if (xml.attributes.length > 0) {
		    for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);

				if (attribute.nodeName == 't') {
                    obj[attribute.nodeValueame] = xml.nodeValue;
                }
			}
		}
	// }
    // else if (xml.nodeType == 3) { // text
	// 	obj = xml.nodeValue;
	// }

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;

			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}

				obj[nodeName].push(xmlToJson(item));
			}
		}
	}

	return obj;
};

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
            "session-token": $("#sessid").val()
            // "Origin": "https://www.bling.com.br",
            // "Referer": "https://www.bling.com.br/produtos.php",
            // "User-Agent": "navigator.userAgent",
            // "Cookie": document.cookie
        },
        data: {
        xajax: "obterProduto",
            "xajaxargs[]": codigoProduto
        },
        success: function(response) {
            console.log(xmlToJson(response)); // Converting XML to JSON
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
