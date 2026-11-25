const serviceId = '7f8e1000-94ec-41ed-bd90-67bc52b9aa21';
const commandId = '7f8e1001-94ec-41ed-bd90-67bc52b9aa21';
const get = id => document.getElementById(id);
const status = message => { get('message').textContent = message; };
let device, command, retry, lostAt, connecting = false, sending = false;
const code = () => get('code').value.trim();

async function feed() {
  if (!command || sending) return;
  if (!/^\d{6}$/.test(code())) {
    status('Enter the six-digit code on the laptop.');
    return;
  }
  sending = true;
  get('send').disabled = true;
  try {
    const value = new TextEncoder().encode('feed:' + code());
    if (command.writeValueWithResponse) await command.writeValueWithResponse(value);
    else await command.writeValue(value);
    status('The fish have been fed.');
  } catch {
    status('Feeding was rejected. Check the laptop code and Bluetooth connection.');
  } finally {
    sending = false;
    get('send').disabled = !command;
  }
}
async function connect() {
  const gatt = await device.gatt.connect();
  const service = await gatt.getPrimaryService(serviceId);
  command = await service.getCharacteristic(commandId);
  get('send').disabled = false;
  status('Connected. Ready to feed.');
}
function scheduleReconnect() {
  clearTimeout(retry);
  if (!get('auto').checked || !device) return;
  retry = setTimeout(async () => {
    if (connecting || command || !get('auto').checked) return;
    connecting = true;
    try {
      await connect();
      if (get('auto').checked && Date.now()-lostAt >= 12000) await feed();
    } catch {
      device.gatt.disconnect();
      scheduleReconnect();
    } finally {
      connecting = false;
    }
  }, 4000);
}
function disconnected() {
  command = null;
  get('send').disabled = true;
  lostAt = Date.now();
  status(get('auto').checked ? 'Out of range. Waiting to reconnect…' : 'Disconnected.');
  scheduleReconnect();
}
get('auto').onchange = () => {
  clearTimeout(retry);
  if (!command && lostAt) scheduleReconnect();
};
get('connect').onclick = async () => {
  if (connecting) return;
  if (!navigator.bluetooth) {
    status('Open this HTTPS controller page in Bluefy to use Bluetooth.');
    return;
  }
  connecting = true;
  clearTimeout(retry);
  get('connect').disabled = true;
  try {
    const selected = await navigator.bluetooth.requestDevice({filters:[{services:[serviceId]}]});
    if (device) {
      device.removeEventListener('gattserverdisconnected',disconnected);
      device.gatt.disconnect();
    }
    command = null;
    get('send').disabled = true;
    device = selected;
    device.addEventListener('gattserverdisconnected',disconnected);
    await connect();
  } catch (error) {
    status('Connection failed. Check that the laptop says Bluetooth Started. ' + error.message);
  } finally {
    connecting = false;
    get('connect').disabled = false;
  }
};
get('send').onclick = feed;
