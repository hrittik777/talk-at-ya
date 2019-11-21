const socket = io();
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $shareLocationButton = document.querySelector("#share-location");
const $messages = document.querySelector("#messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
	const $lastMessage = $messages.lastElementChild;
	const lastMessageStyles = getComputedStyle($lastMessage);
	const lastMessageHeight = $lastMessage.offsetHeight + parseInt(lastMessageStyles.marginBottom);
	const visibleHeight = $messages.offsetHeight;
	const containerHeight = $messages.scrollHeight;
	const scrollOffset = $messages.scrollTop + visibleHeight;
	if(containerHeight - lastMessageHeight <= scrollOffset) $messages.scrollTop = $messages.scrollHeight;
};

socket.on("message", message => {
	console.log(message);
	const html = Mustache.render(messageTemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

socket.on("locationMessage", location => {
	console.log(location);
	const html = Mustache.render(locationTemplate, { username: location.username, url: location.url, createdAt: moment(location.createdAt).format('h:mm a') });
	$messages.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

socket.on("roomInfo", ({room, users}) => {
	const html = Mustache.render(sidebarTemplate, { room, users });
	document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", event => {
	event.preventDefault();
	$messageFormButton.setAttribute("disabled", "disabled");
	const message = event.target.elements.message.value;
	socket.emit("sendMessage", message, dateTime => {
		$messageFormButton.removeAttribute("disabled");
		$messageFormInput.value = "";
		$messageFormInput.focus();
		console.log("Delivered at", dateTime);
	});
});

$shareLocationButton.addEventListener("click", () => {
	if (!navigator.geolocation) return alert("Geolocation not spported.");
	$shareLocationButton.setAttribute("disabled", "disabled");
	navigator.geolocation.getCurrentPosition(position => socket.emit("shareLocation", { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
		$shareLocationButton.removeAttribute("disabled");
		console.log("Location shared.");
	}));
});

socket.emit("join", { username, room }, (error) => {
	if(error) {
		alert(error);
		location.href = "/";
	}
});