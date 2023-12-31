import {
    addNewMessageAndLink,
    deleteNode,
    createLinkBetweenNodes,
    deleteLink,
    addNewMessageAndAssociateWithLink
} from './node-edge-management.js';
import { getCurrentUsername, getParameterByName } from './utils.js';

// Declare configuration arrays as pairs
const messageTypeOptions = [['Claim', 'claim'], ['Question', 'question'], ['Argument', 'argument']];
const linkTypeOptions = [
    ['Proves', 'proves'],
    ['Disproves', 'disproves'],
    ['Answers', 'answers'],
    ['Is Premise Of', 'is_premise_of']
];

// Function to create a popup menu
function createPopupMenu(nodeId, coordinates, container, graphData) {
    const popup = createPopupElement(coordinates, container);

    const nodeData = graphData.nodes.get(nodeId);

    // Add the node's text to the popup
    const textElement = document.createElement('p');
    textElement.textContent = nodeData.label;
    textElement.style.userSelect = 'text'; // Ensure the text is selectable
    popup.appendChild(textElement);

    const currentUsername = getCurrentUsername();
    if (nodeData.author === currentUsername) {
        addDeleteButton(nodeId, popup, graphData);
    }
    addCloseButton(popup);
    addCopyLinkButton(nodeId, popup);
    addAddMessageButton(nodeId, popup, graphData);

    document.body.appendChild(popup);
}

function addCopyLinkButton(nodeId, popup) {
    // Create a button to copy the link to clicked node
    const copyLinkButton = document.createElement('button');
    copyLinkButton.innerHTML = 'Copy Link';
    copyLinkButton.onclick = function () {
        copyNodeLink(nodeId);
    };
    popup.appendChild(copyLinkButton);
}

function createPopupElement(coordinates, container) {
    const popup = document.createElement('div');
    popup.classList.add('popup-menu');

    const position = calculatePopupPosition(coordinates, container);
    popup.style.top = position.top + 'px';
    popup.style.left = position.left + 'px';

    return popup;
}

function calculatePopupPosition(coordinates, container) {
    const containerRect = container.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
        top: coordinates.y + containerRect.top + scrollTop,
        left: coordinates.x + containerRect.left + scrollLeft
    };
}

function addDeleteButton(nodeId, popup, graphData) {
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = function () {
        // Display confirmation dialog
        const confirmDelete = confirm('Are you sure you want to delete this node?');
        if (confirmDelete) {
            deleteNode(nodeId, graphData);
            closeAllPopups();
        }
    };
    popup.appendChild(deleteButton);
}

function addCloseButton(popup) {
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    closeButton.onclick = function () {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    };
    popup.appendChild(closeButton);
}

function closeAllPopups() {
    const popups = document.querySelectorAll('.popup-menu');
    popups.forEach(function (popup) {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    });
}

function createSelect(options, id) {
    const select = document.createElement('select');
    select.id = id;

    options.forEach(function (option) {
        const optionElement = document.createElement('option');
        optionElement.value = option[1];
        optionElement.text = option[0];
        select.appendChild(optionElement);
    });

    return select;
}

function extractNodeIdFromURL(url) {
    try {
        const messageId = getParameterByName('messageId', url);
        return messageId ? parseInt(messageId, 10) : null;
    } catch (error) {
        return null;
    }
}

function showAddMessageForm(nodeId, popup, graphData) {
    // Create form elements
    const form = document.createElement('form');
    const textarea = document.createElement('textarea');
    const messageTypeSelect = createSelect(messageTypeOptions, 'type'); // Set id attribute
    const linkTypeSelect = createSelect(linkTypeOptions, 'linkType'); // Set id attribute
    const submitButton = document.createElement('button');

    // Set attributes and innerHTML
    textarea.name = 'message_content';
    submitButton.innerHTML = 'Submit';

    // Append elements to form
    form.appendChild(textarea);
    form.appendChild(messageTypeSelect);
    form.appendChild(linkTypeSelect);
    form.appendChild(submitButton);

    form.onsubmit = function (event) {
        event.preventDefault();

        // Retrieve form values using the correct IDs
        const content = textarea.value;
        const type = messageTypeSelect.value;
        const linkType = linkTypeSelect.value;

        // Add a new message and link

        const sourceNodeId = extractNodeIdFromURL(content);

        if (sourceNodeId && graphData.nodes.get(sourceNodeId)) {
            // Content is a URL pointing to another node, create a link
            createLinkBetweenNodes(sourceNodeId, nodeId, graphData, linkType);
        } else {
            addNewMessageAndLink(content, type, linkType, nodeId, graphData);
        }

        // Remove the form from the popup
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    };

    popup.appendChild(form);
}

function addAddMessageButton(nodeId, popup, graphData) {
    const addMessageButton = document.createElement('button');
    addMessageButton.innerHTML = 'Add Message';
    addMessageButton.onclick = function () {
        // Display form for adding a new message
        showAddMessageForm(nodeId, popup, graphData);
    };
    popup.appendChild(addMessageButton);
}

// Function to copy the link to the node
function copyNodeLink(nodeId) {
    const nodeLink = window.location.origin + '/core/post_message/?messageId=' + nodeId;
    navigator.clipboard.writeText(nodeLink)
        .then(() => {
            alert('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
        });
}

function createEdgePopupMenu(edgeId, coordinates, container, graphData) {
    const popup = createPopupElement(coordinates, container);

    // Add options specific to edges
    addDeleteLinkButton(edgeId, popup, graphData);
    addAddMessageToLinkButton(edgeId, popup, graphData);
    addCloseButton(popup);

    document.body.appendChild(popup);
}

function addAddMessageToLinkButton(edgeId, popup, graphData) {
    const addMessageButton = document.createElement('button');
    addMessageButton.innerHTML = 'Add Message to Link';
    addMessageButton.onclick = function() {
        showAddMessageToLinkForm(edgeId, popup, graphData);
    };
    popup.appendChild(addMessageButton);
}

function showAddMessageToLinkForm(edgeId, popup, graphData) {
    // Similar to showAddMessageForm, but for adding a message to a link
    const form = document.createElement('form');
    const textarea = document.createElement('textarea');
    const messageTypeSelect = createSelect(messageTypeOptions, 'type');
    const linkTypeSelect = createSelect(linkTypeOptions, 'linkType'); // Set id attribute
    const submitButton = document.createElement('button');
    submitButton.innerHTML = 'Submit';

    form.appendChild(textarea);
    form.appendChild(messageTypeSelect);
    form.appendChild(linkTypeSelect);
    form.appendChild(submitButton);

    form.onsubmit = function(event) {
        event.preventDefault();
        const content = textarea.value;
        const type = messageTypeSelect.value;
        const linkType = linkTypeSelect.value;

        addNewMessageAndAssociateWithLink(content, type, linkType, edgeId, graphData);

        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    };

    popup.appendChild(form);
}

function addDeleteLinkButton(edgeId, popup, graphData) {
    const deleteLinkButton = document.createElement('button');
    deleteLinkButton.innerHTML = 'Delete Link';
    deleteLinkButton.onclick = function () {
        // Confirmation dialog before deleting the link
        const confirmDelete = confirm('Are you sure you want to delete this link?');
        if (confirmDelete) {
            deleteLink(edgeId, graphData);
            closeAllPopups();
        }
    };
    popup.appendChild(deleteLinkButton);
}

export { createPopupMenu, closeAllPopups, createSelect, createEdgePopupMenu };
