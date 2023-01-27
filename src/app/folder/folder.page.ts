import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpParams } from '@angular/common/http';
import { LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

@Component({
	selector: 'app-folder',
	templateUrl: './folder.page.html',
	styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, AfterViewInit {



	public folder: string = 'Gobierno Regional de Ancash';
	@ViewChild("fileDropRef", { static: false })
	fileDropEl?: ElementRef;
	files: any[] = [];
	o: any = { anonimo: null };
	sended: boolean = false;
	isDisabled: boolean = true;

	types: any[] = [];

	oficinas: any[] = [];

	personals: any[] = [];

	datosRENIEC: any[] = [];

	input?: ElementRef;

	@ViewChild('input') set content(content: ElementRef) {
		if (content) { // initially setter gets called with undefined

			console.log(content);


			this.input = content;
			this.ngAfterViewInit();
		}
	}

	// constructor(private activatedRoute: ActivatedRoute) { }

	ngOnInit() {
		var me = this;
		me.http.get(environment.APP_BASE_URL + '/api/denuncia/api/motivo').subscribe(data => {
			me.types = (data as any[]);
			console.log(data);
		}, (error) => {
			console.log(error);
		})

		me.http.get(environment.APP_BASE_URL + '/api/denuncia/api/oficina').subscribe(data => {
			me.oficinas = (data as any[]);
			console.log(data);
		}, (error) => {
			console.log(error);
		})
		//this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
	}
	constructor(private http: HttpClient, private loadingCtrl: LoadingController, private toastr: ToastrService) { }


	changeOficina() {
		var me = this;
		me.http.get(environment.APP_BASE_URL + '/api/denuncia/api/personal/' + this.o.oficina).subscribe(data => {
			me.personals = (data as any[]);
			console.log(data);
		}, (error) => {
			console.log(error);
		})
	}

	searchDNI(event: any) {
		if (this.o.tipodocumento == "DNI") {
			if (this.o.nrodocumento.length == '8') {
				this.simpleLoader();
				const body = { dni: this.o.nrodocumento };
				this.http.get<any>(environment.APP_BASE_URL + '/api/reniec/Consultar?nuDniConsulta=' + this.o.nrodocumento + '&out=json').subscribe(data => {
					var datos = data.consultarResponse.return;
					if (data) {
						this.dismissLoader();
						if (datos.coResultado == '0000') {
							this.o.apenombres = datos.datosPersona.prenombres + ' ' + datos.datosPersona.apPrimer + ' ' + datos.datosPersona.apSegundo;
							this.o.domicilio = datos.datosPersona.direccion;
							this.isDisabled = true;
							this.toastr.success(datos.deResultado);

						} else {
							this.toastr.warning(datos.deResultado);
							this.isDisabled = false;
							this.o.domicilio = '';
							this.o.apenombres = '';
						}
					}
				});

			}
		} else {
			this.isDisabled = false;
			this.o.domicilio = '';
			this.o.apenombres = '';
		}
	}
	simpleLoader() {
		this.loadingCtrl.create({
			message: 'Cargando datos personales, Espere...'
		}).then((response) => {
			response.present();
		});
	}

	dismissLoader() {
		this.loadingCtrl.dismiss().then((response) => {
			console.log('Loader closed!', response);
		}).catch((err) => {
			console.log('Error occured : ', err);
		});
	}

	changeTipodocumento() {
		this.o.nrodocumento = '';
		if (this.o.tipodocumento != "DNI") {
			this.isDisabled = false;
			this.o.domicilio = '';
			this.o.apenombres = '';
		} else {
			this.isDisabled = true;
		}
	}

	onFileDropped($event: any) {
		this.prepareFilesList($event);
	}

	/**
	 * handle file from browsing
	 */
	fileBrowseHandler($event: any) {
		var e = ($event as any);
		var files: Array<any> = e.target.files;
		/*files: Array<any>
		  ) {*/
		this.prepareFilesList(files);
	}

	/**
	 * Delete file from files list
	 * @param index (File index)
	 */
	deleteFile(index: number) {
		/*if (this.files[index].progress < 100) {
		  console.log("Upload in progress.");
		  return;
		}
		this.files.splice(index, 1);*/
	}

	/**
	 * Simulate the upload process
	 */
	uploadFilesSimulator(index: number) {
		/*setTimeout(() => {
		  if (index === this.files.length) {
			return;
		  } else {
			const progressInterval = setInterval(() => {
			  if (this.files[index].progress === 100) {
				clearInterval(progressInterval);
				this.uploadFilesSimulator(index + 1);
			  } else {
				this.files[index].progress += 5;
			  }
			}, 200);
		  }
		}, 1000);*/
	}

	/**
	* Convert Files list to normal array list
	* @param files (Files List)
	*/
	prepareFilesList(files: Array<any>) {
		let me = this;
		me.upload(files[0], (event: any) => {
			switch (event!.type) {
				case HttpEventType.UploadProgress:
					console.log(event);
					break;
				case HttpEventType.Response:
					me.o = { ...me.o, ...event.body };
					break;
				//default:
				//return `File "x" surprising upload event: ${event.type}.`;
			}
		});
		/*for (const item of files) {
			item.progress = 0;
			//this.files.push(item);
		}
		this.fileDropEl!.nativeElement!.value = "";
		this.uploadFilesSimulator(0);*/
	}

	/**
	* format bytes
	* @param bytes (File size in bytes)
	* @param decimals (Decimals point)
	*/
	formatBytes(bytes: any, decimals = 2) {
		if (bytes === 0) {
			return "0 Bytes";
		}
		const k = 1024;
		const dm = decimals <= 0 ? 0 : decimals;
		const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
	}

	async send() {
		let me = this;
		const loading = await this.loadingCtrl.create({ message: 'Enviando...', });
		loading.present();
		console.log(me.o);
		me.http.post<any>(environment.APP_BASE_URL + '/api/denuncia/api/addDenuncia', me.o).subscribe(data => {
			if (data.result == 1) {
				loading.dismiss();
				me.sended = true;
				me.o.code = data.msj;
			} else {
				loading.dismiss();
				this.toastr.warning(data.msj);
			}
			console.log(data);
		}, (error) => {
			console.log(error);
			setTimeout(() => {
				loading.dismiss();
				this.toastr.error("Ups! Algo salio mal, actulize la pagina. Gracias");
			}, 2000);
		})
	}

	baseAPI: string = 'https://web.regionancash.gob.pe';

	upload(file: any, callback?: any) {
		const formData = new FormData();
		var me = this;
		//formData.append('file', file,file.name);

		let headers = new HttpHeaders();
		/** In Angular 5, including the header Content-Type can invalidate your request */
		headers.append('Content-Type', 'multipart/form-data');
		headers.append('Accept', 'application/json');


		const options = {
			headers: headers,
			params: new HttpParams(),
			observe: 'events',
			reportProgress: true,
		};

		formData.append("file", file);
		formData.append('filename', file.name);



		setTimeout(async () => {

			const loading = await this.loadingCtrl.create({ message: 'Adjuntando archivo...', });
			loading.present()
			me.http.post(me.baseAPI + '/api/file/upload', formData, {
				observe: 'events',
				reportProgress: true
			}).subscribe((event: any) => {
				switch (event!.type) {
					case HttpEventType.UploadProgress:
						if (event!.total) {
							let p = (event.loaded / event.total) * 100;

							callback({ upload: event.loaded, total: event.total, msg: p.toFixed(2) + '% (' + event.loaded + '/' + event!.total + ')' });
						}
						break;
					case HttpEventType.Response:
						if (callback) callback(event);
						loading.dismiss();
						break;
					//default:
					//return `File "x" surprising upload event: ${event.type}.`;
				}
			}, (err: any) => {
				if (err.status == 413) {
					me.notify('msg-error', 'Error, archivo muy pesado (máx. 1mb).');
				} else if (err.status == 406) {
					me.notify('msg-error', 'Error , solo se permite jpeg, jpg o png.');
				} else if (err.status == 500) {
					me.notify('msg-error', 'Error con el archivo.');
				}
			});

		}, 1);

	}

	notify(title: string, msg: string) {
		console.log(msg);
	}

	ngAfterViewInit() {
		setTimeout(() => {
			//alert(this.input);
			// server-side search
			if (this.input) {

				fromEvent(this.input.nativeElement, 'keyup')
					.pipe(
						//filter(Boolean),
						debounceTime(1000),
						distinctUntilChanged(),
						tap((text) => {
							console.log(this.input!.nativeElement.value)
						})
					)
					.subscribe();
			}
		}, 2050);
	}

	numberOnlyValidation(event: any) {
		const pattern = /[0-9.,]/;
		let inputChar = String.fromCharCode(event.charCode);

		if (!pattern.test(inputChar)) {
			// invalid character, prevent input
			event.preventDefault();
		}
	}


}