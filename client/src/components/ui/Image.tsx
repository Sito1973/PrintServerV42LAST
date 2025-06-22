import { useState, useEffect } from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * Componente Image que intenta cargar la imagen desde diferentes rutas
 * Si la primera ruta falla, intenta con la segunda
 */
const Image = ({ src, fallbackSrc, alt, ...props }: ImageProps) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setImgSrc(src);
    setAttempt(0);
  }, [src]);

  const handleError = () => {
    if (attempt === 0 && src) {
      // Primera prueba: intentar sin slash al inicio
      if (src.startsWith('/')) {
        setImgSrc(src.substring(1));
      } else {
        // Si no tiene slash, intentar con slash
        setImgSrc(`/${src}`);
      }
      setAttempt(1);
    } else if (attempt === 1 && src) {
      // Segunda prueba: intentar con /images/
      if (src.includes('/images/')) {
        setImgSrc(src.replace('/images/', '/'));
      } else if (src.startsWith('/')) {
        setImgSrc(`/images${src}`);
      } else {
        setImgSrc(`/images/${src}`);
      }
      setAttempt(2);
    } else if (fallbackSrc) {
      // Última opción: usar fallback
      setImgSrc(fallbackSrc);
      setAttempt(3);
    } else {
      // Si todo falla, mostrar un placeholder
      console.error(`Could not load image: ${src}`);
      setImgSrc(undefined);
      setAttempt(4);
    }
  };

  return imgSrc ? (
    <img src={imgSrc} alt={alt} onError={handleError} {...props} />
  ) : (
    // Placeholder si no se puede cargar la imagen
    <div
      className={`flex items-center justify-center bg-gray-200 text-gray-400 ${props.className}`}
      style={{ width: props.width, height: props.height }}
    >
      {alt || "Image"}
    </div>
  );
};

export default Image;