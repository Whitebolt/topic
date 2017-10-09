const mockEmitterListeners = new WeakMap();

function mockEmitterGetListeners(emitter, eventName) {
	if (!mockEmitterListeners.has(emitter)) mockEmitterListeners.set(emitter, new Map());
	if (!mockEmitterListeners.get(emitter).has(eventName)) mockEmitterListeners.get(emitter).set(eventName, new Set());
	return mockEmitterListeners.get(emitter).get(eventName);
}

class EventEmitter {
	on(eventName, listener) {
		mockEmitterGetListeners(this, eventName).add(listener);
	}

	once(eventName, listener) {
		const listeners = mockEmitterGetListeners(this, eventName);
		let _listener = (...params)=>{
			listener(...params);
			listeners.delete(_listener);
			_listener = undefined;
		};
		listeners.add(_listener);
	}

	emit(eventName, ...params) {
		mockEmitterGetListeners(this, eventName).forEach(listener=>listener(...params));
	}
}