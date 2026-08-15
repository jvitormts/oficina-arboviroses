# Guia operacional — Alertas de Arboviroses

## Finalidade

Esta plataforma centraliza comunicados epidemiológicos destinados aos setores municipais de saúde. A interface foi concebida com referências ao Padrão Digital de Governo, que reúne fundamentos visuais, padrões de navegação, acessibilidade e componentes reutilizáveis para serviços públicos digitais.[1]

## Acesso e perfis

O administrador utiliza o acesso administrativo já configurado. Cada usuário comum, na primeira visita, deve selecionar **Gerar acesso**. O sistema cria uma credencial individual no formato `usuario-XXXX` e uma senha simples com palavra aleatória e dois números. As credenciais aparecem apenas nesse momento, portanto devem ser guardadas antes de fechar a janela.

| Perfil | Permissões | Uso previsto |
| --- | --- | --- |
| **Administrador** | Cria, edita e exclui alertas, agenda publicações e consulta confirmações de leitura. | Gestão do sistema. |
| **Usuário comum** | Consulta comunicados publicados e confirma a leitura de cada alerta. | Cada profissional ou setor recebe uma credencial individual gerada na primeira visita. |

## Publicar um alerta

Na área **Administração**, selecione **Novo alerta**. Preencha título, resumo, observações e data/hora de publicação. O sistema mantém o alerta invisível para os setores até o instante agendado. A publicação não depende de uma tarefa manual posterior: a regra do servidor libera o comunicado somente quando a data/hora definida já foi alcançada.

Para uma sessão de usuário comum que permaneça aberta, o sistema programa uma atualização local para o próximo horário de publicação e conserva uma verificação de contingência a cada 15 segundos. Se a rede ficar indisponível, a consulta é suspensa e o usuário recebe um aviso; ao reconectar, a atualização é retomada. Caso o navegador esteja fechado, o alerta será exibido quando o usuário acessar o painel novamente após a publicação.

## Acompanhar leituras

O usuário comum visualiza um comunicado, e a leitura é registrada com data e hora para sua credencial individual. O administrador não gera confirmação de leitura ao consultar alertas. No painel administrativo, cada alerta exibe a **quantidade de leituras** confirmadas; o botão **Leituras** apresenta exclusivamente as credenciais individuais que leram o comunicado.

> O aviso visual de alto impacto é exclusivo de contas de setor de saúde. Administradores não recebem esse modal ao navegar pelos comunicados.

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| Regras de senha, autorização administrativa, publicação agendada, leitura exclusiva do usuário comum, contagem, exibição por perfil, erro, recuperação de atualização, autenticação, colisão e geração de credenciais individuais | 19 testes automatizados aprovados. |
| Tipagem do projeto | Verificação estática aprovada. |
| Painéis administrativo e de comunicados em desktop e em largura móvel de 375 px | Revisados visualmente; estados vazio e de falha possuem tratamento dedicado. |

## Referências

[1] [Padrão Digital de Governo — Design System](https://www.gov.br/ds/home)
