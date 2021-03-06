import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ArqueoService } from 'src/app/services/arqueo.service';
import { SucursalesService } from 'src/app/services/sucursales.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import Swal from 'sweetalert2'
import { PdfMakeWrapper, Table, Txt, Img } from 'pdfmake-wrapper';//para poder utilizar pdfMake-wrapper


@Component({
  selector: 'app-reporte-general',
  templateUrl: './reporte-general.component.html',
  styleUrls: ['./reporte-general.component.css']
})
export class ReporteGeneralComponent implements OnInit {

  public formulario: FormGroup;
  public usuario: any;
  public clientRole = false;
  public vendedorRole = false;
  public adminRole = false;
  public informePDF = false;
  public sucursales = [];
  public reportes = [];
  public start: any;
  public end: any;
  public contadorS: number = 0;
  constructor(private fb: FormBuilder, private usuarioService: UsuarioService,
    private sucursalesService: SucursalesService, private arqueoService:ArqueoService) { }
  ngOnInit(): void {
    this.subirInicio();
    this.sucursalesService.getSucursales().subscribe(data => {
      this.sucursales = data['sucursalesBD'];
    });
    this.login(); 
  }
  // Funcion para subir al inicio
  subirInicio(): void{
    window.scroll(0, 0);
  }
  //Verificar si el usuario esta logueado
  login() {
    let loginToken = localStorage.getItem('loginToken');
    if (loginToken) {
      this.usuarioService.verificarLogin(loginToken).subscribe(data => {
        
        this.usuario = data['usuario'];
        if (this.usuario.role == 'CLIENT_ROLE') {
          this.clientRole = true;
        } else if (this.usuario.role == 'ADMIN_ROLE') {
          this.adminRole = true;
        } else if (this.usuario.role == 'USER_ROLE') {
          this.vendedorRole = true;
        }
        this.crearFormulaio();
      }, err => {
          console.warn(err);
          // Remover el token
          localStorage.removeItem('loginToken');
          //vamos a recargar la pagina 3 segundos despues
          setTimeout(() => {
          //Recargar la pagina para que actualice el estado del usuario
          window.location.reload(); 
          }, 1000);
      });
    }
  }
  crearFormulaio() {
    if (this.usuario.role == 'ADMIN_ROLE') {
      this.formulario = this.fb.group({
        start: ['', Validators.required],
        end: ['', Validators.required],
      }); 
    }
  }
  enviarFormulario() {
    let loginToken = localStorage.getItem('loginToken');
    let fehcaStart = this.formulario.controls.start.value;
    let fechaEnd = this.formulario.controls.end.value;
    this.start = `${fehcaStart.getFullYear()}-${fehcaStart.getMonth()+1}-${fehcaStart.getDate()}`;
    this.end = `${fechaEnd.getFullYear()}-${fechaEnd.getMonth()+1}-${fechaEnd.getDate()}`;
    if (this.formulario.valid) {
      if (this.usuario.role == 'ADMIN_ROLE') {
        let contador = 0;
        for (const sucursal of this.sucursales) {
          this.arqueoService.getReporte(sucursal._id, loginToken, this.start,this.end ).subscribe(data => {
            //vaciar formulario
            this.cargarData(data);
          }, err => {
              let data = {
                ok: true,
                sucursal: sucursal.titulo,
                desde: this.start,
                hasta: this.end,
                ventaNeta: 0,
                costo: 0,
                totalUtilidad: 0,
                totalGasto: 0,
                totalDeposito: 0,
                montoComprobantes: 0,
                ganancia: 0,
                comprobantesGasto: []
                
              }
              this.cargarData(data);
          });
          contador++;
        }
        
      }
    }    
  }
  borrarFormulario() {
    if (this.usuario.role == 'ADMIN_ROLE') {
      this.formulario.reset({
        start: '',
        end: '',
      })
    }
  }
  async cargarData(data) {
    this.reportes.push(data);
    this.contadorS++
    if (this.contadorS === this.sucursales.length) {
      this.generarPdf(this.reportes, this.start, this.end);
       //imprimir mensaje
       Swal.fire({
        allowOutsideClick: false,//false, no puede dar click en otro lugar
        title: 'Reporte General',
        text: 'Reporte generado con Exito!!!',
        icon: 'success',
        confirmButtonText: 'Ok'
      })
    }
  }
   generarPdf(informes, start, end) {

     //Crear el objeto pdf
     const pdf = new PdfMakeWrapper();

    
    let datosTabla = [];
    //Encabezado de la tabla
     let encabezadoTabla = [];
    let nombreSucursal = new Txt('SUCURSAL')
     .bold()
     .decorationStyle('dotted')
     .fontSize(12)
     .alignment('center').end;
    let ventaNeta = new Txt('VENTA NETA')
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
    let costo = new Txt('COSTO')
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
    let gasto = new Txt('GASTO')
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
   let utilidad = new Txt('UTILIDAD')
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
     let ganancia = new Txt('GANANCIA')
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
       .alignment('center').end;
       let deposito = new Txt('DEPOSITO')
       .bold()
       .decorationStyle('dotted')
       .fontSize(12)
       .alignment('center').end;
    encabezadoTabla.push(nombreSucursal);
    encabezadoTabla.push(ventaNeta);
    encabezadoTabla.push(costo);
    encabezadoTabla.push(gasto);
    encabezadoTabla.push(utilidad);
    encabezadoTabla.push(ganancia);
    encabezadoTabla.push(deposito);
    datosTabla.push(encabezadoTabla);

        
    
     //Cargar JSON para la tabla
    
     for (const informe of informes) {
      console.log(informe)
       let tablaBody = [];
       tablaBody.push(informe.sucursal);
      tablaBody.push(`${this.number_format(informe.ventaNeta, 0)} Gs.`);
       tablaBody.push(`${this.number_format(informe.costo, 0)} Gs.`);
       tablaBody.push(`${this.number_format(informe.totalGasto, 0)} Gs.`);
       tablaBody.push(`${this.number_format(informe.totalUtilidad, 0)} Gs.`);
       tablaBody.push(`${this.number_format(informe.ganancia, 0)} Gs.`);
       tablaBody.push(`${this.number_format(informe.totalDeposito, 0)} Gs.`);
      datosTabla.push(tablaBody);
    }
     console.log(datosTabla);

      //Crear tabla
    let tabla = new Table(datosTabla).relativePosition(50,22).alignment('center').layout('lightHorizontalLines').end;
    //Cargar la tabla al pdf
    pdf.add(tabla);
    //Generar estilos al pdf
    pdf.defaultStyle({
      bold: false,
      fontSize: 10,
    });
    //Tamaño de hoja
    //pdf.pageSize('EXECUTIVE');
    
    //Generar margenes
    pdf.pageMargins([30, 80, 30, 60]); //left, top, right, botton
    //Horientacion del documento
    pdf.pageOrientation('landscape'); // 'portrait'
    //Generar el Encabezado
    let encabezado = new Txt(`Seda Cosmética`)
      .bold()
      .decorationStyle('dotted')
      .fontSize(14)
      .alignment('center').end;
    let head = [];
    let textoSucursal = new Txt(`Informe General`)
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
      .alignment('center').end;
    let arrayDesde = start.split('-');
    let arrayHasta = end.split('-');
     let textoRango;
     if (start === end) {
       textoRango = new Txt(`Informe diario, ${this.fecha_format(arrayDesde[0], arrayDesde[1]-1, arrayDesde[2])}`)
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
     } else {
      textoRango = new Txt(`Periodo desde el ${this.fecha_format(arrayDesde[0], arrayDesde[1]-1, arrayDesde[2])}, hasta el ${this.fecha_format(arrayHasta[0], arrayHasta[1]-1, arrayHasta[2])}`)
                      .bold()
                      .decorationStyle('dotted')
                      .fontSize(12)
                      .alignment('center').end;
    }
    head.push(encabezado);
    head.push(textoSucursal);
    head.push(textoRango);
    pdf.header(head);
    // ============= Simple watermark ============= la marca de agua
    //pdf.watermark('MXVX Paraguay 2020');
    //Generar el footer
    let fecha = new Date();
    let yyyy = fecha.getFullYear();
    let mm = fecha.getMonth();
    let dd = fecha.getDate();
    let infoFooter = `${this.fecha_format(yyyy,mm,dd)}`;
    let year = fecha.getFullYear();
    let footer = new Txt(
      `${infoFooter} \n Seda Cosmética ${year} \n www.sedacosmetica.com`
    )
      .bold()
      .alignment('center').end;
    pdf.footer(footer);
    //Crear e imprimir pdf
    pdf.create().download(`Informe General - ${infoFooter}`);
    setTimeout(() => {
      this.informePDF = false;
    }, 10000);

  }
  number_format(amount, decimals) {
    amount += ''; // por si pasan un numero en vez de un string
    amount = parseFloat(amount.replace(/[^0-9\.]/g, '')); // elimino cualquier cosa que no sea numero o punto
    decimals = decimals || 0; // por si la variable no fue fue pasada
    // si no es un numero o es igual a cero retorno el mismo cero
    if (isNaN(amount) || amount === 0) 
        return parseFloat('0').toFixed(decimals);
    // si es mayor o menor que cero retorno el valor formateado como numero
    amount = '' + amount.toFixed(decimals);
    var amount_parts = amount.split('.'),
        regexp = /(\d+)(\d{3})/;
    while (regexp.test(amount_parts[0]))
        amount_parts[0] = amount_parts[0].replace(regexp, '$1' + '.' + '$2');
    return amount_parts.join(',');
  }
  fecha_format(yyyy, mm, dd) {
    if(dd<10) 
    {
      dd = '0'+dd;
    } 
    if(mm <10) 
    {
      mm ='0'+mm;
    } 
    let options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    let fecha = new Date(yyyy, mm, dd);
    return fecha.toLocaleDateString("es-ES", options)
  }

}
