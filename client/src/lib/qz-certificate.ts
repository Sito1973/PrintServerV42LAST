/**
 * Configuración de certificados personalizados para QZ Tray
 * Usa los certificados generados por la aplicación de escritorio QZ Tray
 */

// INSTRUCCIONES: 
// 1. Abre el archivo "digital-certificate" desde C:\Users\manag\Downloads\QZ Tray Demo Cert
// 2. Copia todo el contenido (incluyendo -----BEGIN CERTIFICATE----- y -----END CERTIFICATE-----)
// 3. Pégalo entre las comillas del DIGITAL_CERTIFICATE
// 4. Abre el archivo "private-key" desde la misma carpeta
// 5. Copia todo el contenido (incluyendo -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----)
// 6. Pégalo entre las comillas del PRIVATE_KEY

// ESTOS SON LOS CERTIFICADOS REALES GENERADOS POR QZ TRAY DEMO
// Debes copiar el contenido EXACTO de tus archivos desde C:\Users\manag\Downloads\QZ Tray Demo Cert

// PASO 1: Abre el archivo "private-key" y copia TODO su contenido aquí:
export const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC18bENWnAnV4B5
bxTlNYn90LOLkVBJZ8zJBkoWzbNsZ0N+Nwqnev9fi2bySfimPAyrNiBVM9k3Lj8Z
03wE2WA7lDO6Faeia4V6f4Mt7DMFeIRoeRYwCxpvC1qZ46rsJNY2bFWDmYX1FGkC
54Er9jf7mErdrAqUdminsyyvubXsWbo4+Hk0Y2MI9+RuQhsiKiUOxpNkp3BoIL/I
AUFqUsLuF5qE4jX9inJ58ZLrjk8b0BeUmf0HVRded+u5oSioWSgpRZNwAED83OLZ
2fh+7AEfDSN7vrtHL9PaWGaz2hgdHlHxKnAFNu5P4s5Tm1H/GTDl6TGy2zekHfwZ
0ryI5sRBAgMBAAECggEAIGngBIR9oYylrzyaaOE6ZbT2H6GyP3mWEqQjs99OnTvi
Wsx8gezYLRHdM8H44cil6ySX6wXzJzD+fd/e4tBFJCgZdQfhlv53x6SK3rYLOujH
EgOsb7+ypGDN8ceNDkfbv9NaArlpk4lg0esjaI0TWSe/ArHhKqTTrTiu99lqbyIa
McMnNKe8bWXYhB2LstNurMEN/TgT3sqVH3ipTKaGl/FPz8J98XGa/56raOnCku2+
JaaHKdW5S/f6sgdEsFk1f1DcEl4o7QElHBFT1wG4nVmenhLcM4c6r921hTKZsgsx
S7/AHerCBHrPc5xVH71BvOAACNezfnxuG8xPccUFrwKBgQDbji4v+1vXEcH8EKU3
0UlHupPIK57F5z7MPLKejIJd5t/LjA2PUex15jrYxQt0k3eu9koFFFem0o/8EkaL
NCsTKjTpBg6Yf8DSsgQeF7NhawNW3XYAASGE8gNA/hOA18ekfb315DEl8GDY3NCf
qunM5yN6064sKophbUOGI67NzwKBgQDUJUBs5qdgWfXfukLJPMqCv1jUn4bT5zEK
jfnXZ+jQrQP1Ucdhl9atoGfH8LNMzBGQMpiG0A2QQjSvduXR8VZaXAkahI6wBEtd
0x/pPW2r+C4Q50QhyAZ50K0sOWV7Wwau4JrBX+u5i7Qr5c8kebFN3mSa3UvMy2sB
cskXrMlg7wKBgQCr+VSIVPT9I3W1ATzI2e/ydVyoYDJ/hcCUrb6jnh/Heb42a797
UYpMV0gk30M3zwLiUxxrmiGGFEyf/5iuFPDglCDZndr07KyW3MWI5LunRPFaqyFw
o3Ij9oVB9UJFm79PQwb2ggVVWFIjy+LGDlQQIcSSwxgclD3MTo+jlHOp1QKBgQCr
TclQJpBRRVM9bXIwfV4pZcmdJ5P/2FfJZguw3L8qggsINRkCvVEksroawUqHYOFt
xu1TLv1E17EjXqcFeBN6s4bGWvO9Pjp9cNX7yRaeHrFUBOsHPDW+d7reUxqXGVG0
NLnCHGqEUUMTj2ZM1ddOQZ6LTta+cCPf74hiDawvEQKBgQDZYSsK6z7Bst0JuIiC
C6qYu27FZ0EmaeUm6cJX5Ab6HVdRYiXj1Dew3IOK+jPC6G7Bcf1c2i2Nv0ak4y7m
wssixsqlETzBk0O036ZI8HJLPqDjURY61jvZLYS0jf3Smmch3/oFtdszn5i6vBRg
CAvd8pS174Snv9c2a9LZpT50qA==
-----END PRIVATE KEY-----`;

// PASO 2: Abre el archivo "digital-certificate" y copia TODO su contenido aquí:
export const DIGITAL_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAZdSb8TNMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI1MDYwODAyMDU0NloXDTQ1MDYwODAyMDU0NlowgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC1
8bENWnAnV4B5bxTlNYn90LOLkVBJZ8zJBkoWzbNsZ0N+Nwqnev9fi2bySfimPAyr
NiBVM9k3Lj8Z03wE2WA7lDO6Faeia4V6f4Mt7DMFeIRoeRYwCxpvC1qZ46rsJNY2
bFWDmYX1FGkC54Er9jf7mErdrAqUdminsyyvubXsWbo4+Hk0Y2MI9+RuQhsiKiUO
xpNkp3BoIL/IAUFqUsLuF5qE4jX9inJ58ZLrjk8b0BeUmf0HVRded+u5oSioWSgp
RZNwAED83OLZ2fh+7AEfDSN7vrtHL9PaWGaz2hgdHlHxKnAFNu5P4s5Tm1H/GTDl
6TGy2zekHfwZ0ryI5sRBAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBTbx514Aq3mBtCDz6VklE28b/zh3jANBgkq
hkiG9w0BAQsFAAOCAQEAm3lWPXbgtpoM8NwnZVIChHp5SaPgH/CsrnTjcGd8EpSb
Etk3+vF2utnHwvGtXebr01ny2iDLoNx1gi7tDd3HAsbqNqPJlSYhSut0yp2rr1hU
kKeUNlL6WqwGshl6IsNp8+BLfCZNDOJWJGFdNy0oi2dDl/0zep8jlBZOaKGgdb2T
k7LLn//eYQHbmAmtM8VOHhnvUUkkrCwsMMXfDofguxQc+mlskcRhHtZUOQy5ooA5
aV3tVi2lLlTKPkpVPCSzv6+dH1bANBDEAaRE6m8sjOUY9FHbR11bA8wqQs/5d9iu
P5Ag59/M3kHff1BtWjL/91c+xHasOiADtme8/rqBdA==
-----END CERTIFICATE-----`;

/**
 * Configurar QZ Tray con los certificados personalizados
 * @param qz Referencia a la biblioteca QZ Tray
 */
export function configureCertificate(qz: any): void {
  try {
    if (!qz) {
      console.error("No se puede configurar el certificado porque QZ Tray no está disponible");
      return;
    }

    console.log("Configurando certificados QZ Tray Demo...");

    console.log("✅ Certificados QZ Tray Demo configurados correctamente");

    // Configurar el certificado digital REAL
    qz.security.setCertificatePromise(function(resolve: any) {
      console.log("Usando certificado QZ Tray Demo personalizado");
      resolve(DIGITAL_CERTIFICATE);
    });

    // Configurar la firma con JSEncrypt (método más confiable para QZ Tray Demo)
    qz.security.setSignaturePromise(function(toSign: any) {
      return function(resolve: any) {
        try {
          if (typeof (window as any).JSEncrypt !== 'undefined') {
            console.log("Firmando con clave privada QZ Tray Demo...");
            
            const sign = new (window as any).JSEncrypt();
            sign.setPrivateKey(PRIVATE_KEY);
            
            // Usar el método de firma estándar
            const signature = sign.sign(toSign, (window as any).CryptoJS?.SHA1, "sha1");
            
            console.log("✅ Firma QZ Tray Demo generada correctamente");
            resolve(signature);
          } else {
            console.error("JSEncrypt no disponible");
            resolve("ERROR_NO_JSENCRYPT");
          }
        } catch (err) {
          console.error("Error al firmar con certificado QZ Tray Demo:", err);
          resolve("ERROR_SIGN_" + Date.now());
        }
      };
    });

    console.log("✅ Certificados QZ Tray Demo configurados correctamente");
  } catch (error) {
    console.error("Error al configurar certificado:", error);
  }
}

export default {
  configureCertificate,
  PRIVATE_KEY,
  DIGITAL_CERTIFICATE
};