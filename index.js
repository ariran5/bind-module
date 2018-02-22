export default class Binding {
	constructor() {
		// нужно улучшить работу с селектом, сейчас если в него не правильно приходит инфа
		// нужно удалять перменные биндингов если нету их элементов на странице
		var _this = this;

		var elements = document.querySelectorAll('[data-bind]');

		this.data = {};

		[].forEach.call(elements,(element) => {

			this.newNode(element);

		});
	}

	init() {
		for (var key in this.data) {
			this.dispatchBind(key);
		}

		this.__observer();
	}

	newNode(element) {
		var bindName = element.dataset.bind;
		if (!this.data[bindName]) {

			if (window[bindName]) {
				throw new Error('Биндинг перебивает переменную, которая уже имеется в window');
			}
			// сделать защиту от перетирания переменных биндинга
			// Object.defineProperty(window, bindName,{
			//	 get:function(){
			//
			//	 },
			//	 set:function(){
			//
			//	 }
			// });

			this.data[bindName] = {
				inputs:[],
				blocks:[],
				selects:[],
				other:[],
				set value(value) {
					if (this.__value == value ) return;
					this.__value = value;
					window[bindName] = value;
					setTimeout(function () {
						dispatchEvent(new Event(bindName,{
								detail: {
									value: value
								}
							})
						);
					}, 3);
				},
				get value(){
					return this.__value;
				},
				__value:null
			}
		}

		if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {

			this.data[bindName].inputs.push(element);
			this.__inputListener(element);

		} else if (element.hasAttribute('contenteditable')){

			this.data[bindName].blocks.push(element);
			this.__blockListener(element);

		} else if (element.tagName == 'SELECT') {

			this.data[bindName].selects.push(element);
			this.__selectListener(element);

		} else {
			this.data[bindName].other.push(element);
		}

		this.prototypeEdit(element,this.data[bindName]);
		return element.tagName;
	}

	dispatchBind(key){

		// считаем вызовы для следующего
		// если 1 из биндингов сработает, то в остальных будет то же самое.
		var count = 0;

		this.data[key].inputs.forEach(item => {
			if (count) return;
			// убрать, временный фикс
			if (item.value === ' ') return;
			// убрать, временный фикс
			if (item.value) {
				count++;
				item.dispatchEvent(new Event('input'))
			}
		});

		this.data[key].blocks.forEach(item => {
			if (count) return;
			if (item.innerText) {
				count++;
				item.dispatchEvent(new Event('input'))
			}
		});

		this.data[key].selects.forEach(item => {
			if (count) return;
			if (item.querySelector('option:checked')) {
				count++;
				item.dispatchEvent(new Event('input'))
			}
		});


		// Брать в оборот тексты из не изменяемых элементов
		this.data[key].other.forEach(item => {
			if (count) return;
			if (item.innerText) {
				count++;
				item.innerText = item.innerText;
			}
		});
	}

	__inputListener(item){

		item.addEventListener('input',e => {

			this.__inputsLogic.call(item,this);
		});
	}
	__blockListener(item){

		item.addEventListener('input',e => {

			this.__blocksLogic.call(item,this);
		});
	}
	__selectListener(item){

		item.addEventListener('input',e => {

			this.__selectLogic.call(item,this);
		});
	}

	__inputsLogic(bindGlobalObj){
		var bindName = this.dataset.bind;
		var els = document.querySelectorAll('[data-bind="'+ bindName +'"]');
		var value = this.value ;
		bindGlobalObj.data[bindName].value = value;


		var _this = this;
		[].forEach.call(els,function(item){
			if (item === _this) return;
			if (item.tagName == 'INPUT' || item.tagName == 'TEXTAREA' || item.tagName == 'SELECT') {
				// bind-empty
				if (!value && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.value = value;
				}
				item.dispatchEvent(new Event('change'));
			} else {
				// bind-empty
				if (!value && item.dataset.bindEmpty) {
					item.innerText = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.innerText = value;
				}
			}
		});
	}
	__blocksLogic(bindGlobalObj){
		var bindName = this.dataset.bind;
		var els = document.querySelectorAll('[data-bind="'+ bindName +'"]');

		var text = this.innerText;
		var html = this.innerHTML;
		var _this = this;

		bindGlobalObj.data[bindName].value = html;

		[].forEach.call(els,function(item){
			item.dispatchEvent(new Event('change'));
			if (item === _this) return;
			if (item.tagName == 'INPUT' || item.tagName == 'TEXTAREA' || item.tagName == 'SELECT') {

				// bind-empty
				if (!text && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.value = text;
				}
			} else {
				// bind-empty
				if (!html && item.dataset.bindEmpty) {
					item.innerText = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.innerHTML = html;
				}
			}
		});
	}

	__selectLogic(bindGlobalObj){
		var els = document.querySelectorAll('[data-bind="'+ this.dataset.bind +'"]');
		var value = this.querySelector('option:checked').value;
		var text = this.querySelector('option:checked').innerText;
		var _this = this;

		bindGlobalObj.data[bindName].value = value;

		[].forEach.call(els, function(item){
			item.dispatchEvent(new Event('change'));
			if (item === _this) return;
			if (item.tagName == 'INPUT' || item.tagName == 'TEXTAREA' || item.tagName == 'SELECT') {
				// bind-empty
				if (!value && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.value = value;
				}
			} else {
				// bind-empty
				if (!text && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.innerText = text;
				}
			}
		});
	}

	__otherLogic(value){
		var els = document.querySelectorAll('[data-bind="'+ this.dataset.bind +'"]');
		var _this = this;

		[].forEach.call(els, function(item){
			if (item === _this) return;
			if (item.tagName == 'INPUT' || item.tagName == 'TEXTAREA' || item.tagName == 'SELECT') {
				// bind-empty
				if (!value && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.value = value;
				}
			} else {
				// bind-empty
				if (!value && item.dataset.bindEmpty) {
					item.value = item.dataset.bindEmpty;
					// bind-empty
				} else {
					item.innerText = value;
				}
			}
		});
	}

	prototypeEdit(element,bindGlobalObj){
		let _this = this;

		if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' || element.tagName == 'SELECT') {

			setPrototype('value');

		} else if (element.constructor.prototype instanceof Element){
			setPrototype('innerHTML')
			setPrototype('innerText')
			setPrototype('innerText')

		}


		function setPrototype(method) {
			let proto;

			switch (true) {
				case method == 'value':
					proto = element.constructor.prototype;
					break;

				case method == 'innerText':
					proto = Node.prototype;
					break;
				case method == 'innerText':
					proto = HTMLElement.prototype;
					break;
				default:
					proto = Element.prototype;
			}

			var descriptor = Object.getOwnPropertyDescriptor( proto, method );
			var oldSetter = descriptor.set;

			descriptor.set = function( value ) {
				if (value != bindGlobalObj.value && !isNaN(value)) {
					bindGlobalObj.value = value;
					_this.__otherLogic.call(this,value);
				}
				oldSetter.apply( this, arguments );
			}
			Object.defineProperty( element, method, descriptor );
		}

	}

	__observer(){
		var observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes.length) {
					[].forEach.call(mutation.addedNodes, node => {
						if (node.nodeType !== Node.ELEMENT_NODE) return;
						node = node.dataset && node.dataset.bind ? node: node.querySelector('[data-bind]');
						if (node) {
							this.newNode(node);
							this.dispatchBind(node.dataset.bind);
						}
					});
				}
				else if (mutation.type == 'attributes' && mutation.attributeName == 'data-bind') {

					this.newNode(mutation.target);
					this.dispatchBind(mutation.target.dataset.bind);
				}
			});
		});

		var observerConfig = {
			attributes: true,
			childList: true,
			subtree: true
		};

		var targetNode = document.body;
		observer.observe(targetNode, observerConfig);

	}
}
