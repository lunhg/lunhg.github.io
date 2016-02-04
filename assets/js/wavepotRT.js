var contextClass = (window.AudioContext || window.webkitAudioContext)

/*
 @bufferSize
 @channels
*/
function WavepotRuntime(o){
    this.code = ""
    this.scope = {};
    this.time = 0;
    this.context = new contextClass();
    this.playing = false;
    this.bufferSize = o.bufferSize || 1024;
    this.channels = o.channels || 2
    this.scriptnode = this.context.createScriptProcessor(this.bufferSize, 0, this.channels);
    this.recording = false;
    var _this = this
    this.scriptnode.onaudioprocess = function(e) {
    
	// Sistema estereofonico de 2 canais
	var out = [
            e.outputBuffer.getChannelData(0),
            e.outputBuffer.getChannelData(1)
        ];
            
	// Tempo discretizado
	var f = 0, t = 0, td = 1.0 / _this.context.sampleRate;
            
	// A cada janela temporal, o valor numerico
	// de amplitude vai ser atualizado
	if (_this.scope && _this.scope.dsp && _this.playing) {
            t = _this.time;
	    _this.scope.set_controls(_this.controls);
	    var i = 0;
	    if
            for (var i = 0; i < out[0].length; i++) {
		// Ajusta o relógio
		// Tempo atual e tempo diferencial
		// Este último será útil para filtros
		_this.scope.set_time(t, td);

		// função definida dinamicamente
		f = _this.scope.dsp();

		// Se a funcao retornar um número
		// utilizar ele nos dois canais
		// Se a funcao retornar um Array
		// de dois valores, separar nos canais
		if(typeof(f) === 'number'){
                    out[0][i] =  f
                    out[1][i] =  f
		}
		else if (typeof(f) === 'object'){
                    out[0][i] =  f[0]
                    out[1][i] =  f[1]
		}
		// Incrementar o tempo
		t += td;
            }
	    _this.time = t;
    
            // Continuar o processamento se nada for atualizado
	} else {
            for (var i = 0; i < out[0].length; i++) {
		out[0][i] = f[0] | f
		out[1][i] = f[1] | f
            }
	}
    }
    this.scriptnode.connect(_this.context.destination);
}

WavepotRuntime.prototype.compile = function(code) {
    // console.log('WavepotRuntime: compile', code);
    this.code = code;
    var ee = null;
    var newscope = new Object();

    try {
	// AMBIENTE DE ÁUDIO INTERNO
	var _code = "var sampleRate = "+this.context.sampleRate+";\n\n"+
	    "var t = 0;\n\n"+
	    "var td = 0;\n\n"+
	    "var bpm = 60;\n\n"+
	    "var controls = {};\n\n"+
	    "var sin = function(f, a) { return a * Math.sin(tau * f * t);};\n\n"+
	    "var saw = function(f, a) { return (1 - 2 * tmod(f, t)) * a; };\n\n"+
	    "var tmod = function(f, t) { return t % (1 / f) * f; };\n\n" +
	    "var tri = function(f, a) { return ttri(f, t) * a; };\n\n" +
	    "var ttri = function(f, t) { return Math.abs(1 - (2 * t * f) % 2 * 2 - 1); };\n\n" +
	    "var pulse = function(f, a, w) { return ((t * f % 1 / f < 1 / f / 2 * w) * 2 - 1) * a; };\n\n" +
	    "this.set_time = function(time, diferencialTime){ t = time; td = diferencialTime};\n\n" +
	    "this.set_controls = function(c){ controls = c};\n\n"+
	    code + 
	    '\n\nthis.dsp = dsp;'
	var f = new Function(_code);
	console.log(f);
	var r = f.call(newscope);
	//    console.log(r);
    } catch(e) {
	//    console.log(e);
	ee = e;
    }
    //    console.log('WavepotRuntime: compiled', newscope);
    if (newscope && typeof(newscope.dsp) == 'function') {
	this.scope = newscope;
	return true;
    } else {
    if(ee){
        return ee.stack.toString();
    }
    return false;
    }
}

WavepotRuntime.prototype.play = function(){
    // console.log('WavepotRuntime: play');
    this.playing = true;
}

WavepotRuntime.prototype.stop = function() {
    // console.log('WavepotRuntime: stop');
    this.playing = false;
        this.recording = false;
}

WavepotRuntime.prototype.reset = function() {
    // console.log('WavepotRuntime: reset');
    this.time = 0;
}

WavepotRuntime.prototype.clear = function(){
        this.worker.postMessage({ command: 'clear' });
}