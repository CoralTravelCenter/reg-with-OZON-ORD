import { v4 } from "uuid";

import { api_endpoint_host } from "./commons";

const request_message_key = 'api-request';
const response_message_key = 'api-response';

const promise_lut = {};

let messageListener;
const actualMessageHandler = ({ data: { pluginMessage: msg } }) => {
    if (msg.key === response_message_key) {
        // console.log('+++ GOT response: msg: %o', msg);
        promise_lut[msg.uuid].resolve(msg.value);
    }
};

export function listenForAPIRequests() {
    figma.ui.on('message', (msg) => {
        if (msg.key === request_message_key) {
            const { url, init } = msg.value;
            fetch(url, init).then((response) => {
                // console.log("*** fetch response: %o", response);
                response.json().then((json) => {
                    // console.log('response JSON %o:', json);
                    figma.ui.postMessage({ key: response_message_key, uuid: msg.uuid, value: json });
                });
            });
        }
    });
}

export function callAPI(api_key, endpoint, method, request_body_json = {}, headers = {}) {
    if (!messageListener) {
        messageListener = actualMessageHandler;
        window.addEventListener('message', messageListener);
    }
    return new Promise((resolve, reject) => {
        const request_id = v4();
        promise_lut[request_id] = {resolve, reject}
        parent.postMessage({
            pluginMessage: {
                key: request_message_key,
                uuid: request_id,
                value: {
                    url: api_endpoint_host + endpoint,
                    init: {
                        method:  method,
                        headers: {
                            Authorization: `Bearer ${ api_key }`,
                            ...headers
                        },
                        body: JSON.stringify(request_body_json)
                    }
                }
            }
        }, '*');
    });
}