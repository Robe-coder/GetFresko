'use client'

import { useState, useTransition } from 'react'
import { completeOnboarding } from '@/lib/actions/onboarding'

const PROVINCES = [
  'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba',
  'Cuenca','Girona','Granada','Guadalajara','Gipuzkoa','Huelva','Huesca',
  'Illes Balears','Jaén','A Coruña','La Rioja','Las Palmas','León','Lleida',
  'Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Palencia','Pontevedra',
  'Salamanca','Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona',
  'Teruel','Toledo','Valencia','Valladolid','Bizkaia','Zamora','Zaragoza',
  'Ceuta','Melilla',
].sort()

const TERMS = `TÉRMINOS Y CONDICIONES DE USO — GETFRESKO

Última actualización: abril de 2025

1. ACEPTACIÓN DE LOS TÉRMINOS

El acceso y uso de la aplicación GetFresko (en adelante, "la Aplicación") implica la aceptación plena y sin reservas de los presentes Términos y Condiciones de Uso (en adelante, "los Términos"). Si no está de acuerdo con alguno de ellos, deberá abstenerse de utilizar la Aplicación.

2. DESCRIPCIÓN DEL SERVICIO

GetFresko es una aplicación de gestión de despensa doméstica que permite al usuario registrar, organizar y gestionar los productos alimentarios de su hogar, recibir alertas de caducidad, obtener sugerencias de recetas y digitalizar tickets de compra mediante tecnología de reconocimiento óptico de caracteres.

3. REGISTRO Y CUENTA DE USUARIO

Para acceder a las funcionalidades de la Aplicación, el usuario deberá crear una cuenta proporcionando una dirección de correo electrónico válida y una contraseña, o autenticarse mediante su cuenta de Google. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.

4. USO ACEPTABLE

El usuario se compromete a utilizar la Aplicación de conformidad con la legislación vigente, la moral y el orden público. Queda expresamente prohibido el uso de la Aplicación con fines ilícitos, fraudulentos o que puedan causar daños a terceros.

5. PLANES Y FACTURACIÓN

La Aplicación ofrece un plan gratuito con funcionalidades limitadas y planes de pago (Premium y Familia) con acceso a funcionalidades adicionales. Los precios y condiciones de cada plan se especifican en la página de suscripción. Los pagos se procesan de forma segura a través de Stripe, Inc. El usuario podrá cancelar su suscripción en cualquier momento desde los ajustes de su cuenta.

6. PROPIEDAD INTELECTUAL

Todos los contenidos de la Aplicación, incluyendo pero no limitándose a textos, gráficos, logotipos, iconos, imágenes y software, son propiedad de GetFresko o de sus licenciantes y están protegidos por la legislación aplicable en materia de propiedad intelectual e industrial.

7. PROTECCIÓN DE DATOS PERSONALES Y POLÍTICA DE PRIVACIDAD

7.1. Responsable del tratamiento: GetFresko, con domicilio a efectos de notificaciones en la dirección de contacto indicada en la Aplicación.

7.2. Finalidad y base jurídica: Los datos personales facilitados por el usuario serán tratados con las siguientes finalidades: (i) gestión de la cuenta de usuario y prestación del servicio contratado, siendo la base jurídica la ejecución del contrato; (ii) comunicaciones relacionadas con el servicio, siendo la base jurídica el interés legítimo del responsable; (iii) cumplimiento de obligaciones legales aplicables.

7.3. Tratamiento analítico y cesión a terceros: Con la finalidad de mejorar la cadena de suministro alimentario y contribuir a la reducción del desperdicio alimentario a escala social, GetFresko podrá tratar y ceder a terceros —incluyendo distribuidores, fabricantes y operadores del sector alimentario— datos estadísticos agregados y debidamente anonimizados relativos a patrones de consumo, hábitos de compra, caducidad de productos y comportamiento de los usuarios en relación con los alimentos. Dichos datos serán tratados de forma que resulte imposible la reidentificación de personas físicas concretas, de conformidad con lo establecido en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD). El tratamiento descrito en este apartado no requerirá consentimiento adicional del usuario en tanto los datos sean objeto de anonimización efectiva previa a su cesión, de acuerdo con los criterios establecidos por el Comité Europeo de Protección de Datos.

7.4. Conservación: Los datos personales se conservarán durante el tiempo necesario para la prestación del servicio y, en su caso, durante los plazos legalmente establecidos.

7.5. Derechos del usuario: El usuario podrá ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de los datos dirigiéndose a la dirección de contacto habilitada en la Aplicación. Asimismo, podrá presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).

8. LIMITACIÓN DE RESPONSABILIDAD

GetFresko no garantiza la disponibilidad continua e ininterrumpida de la Aplicación. En ningún caso GetFresko será responsable de daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la Aplicación.

9. MODIFICACIÓN DE LOS TÉRMINOS

GetFresko se reserva el derecho a modificar los presentes Términos en cualquier momento. Las modificaciones serán notificadas al usuario a través de la Aplicación o por correo electrónico. El uso continuado de la Aplicación tras la notificación de cambios implicará la aceptación de los nuevos Términos.

10. LEY APLICABLE Y JURISDICCIÓN

Los presentes Términos se regirán e interpretarán de conformidad con la legislación española. Para la resolución de cualquier controversia derivada de los mismos, las partes se someten a la jurisdicción de los Juzgados y Tribunales del domicilio del usuario, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.`

export function OnboardingModal() {
  const [step, setStep] = useState<'terms' | 'province'>('terms')
  const [termsRead, setTermsRead] = useState(false)
  const [showFullTerms, setShowFullTerms] = useState(false)
  const [province, setProvince] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAcceptTerms() {
    setStep('province')
  }

  function handleSubmit() {
    if (!province) { setError('Selecciona tu provincia'); return }
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('province', province)
      const result = await completeOnboarding(fd)
      if (result.error) setError(result.error)
      // Si OK, el layout recargará y ocultará el modal
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl">

        {/* Terms step */}
        {step === 'terms' && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900">Bienvenido a GetFresko</h2>
              <p className="text-sm text-gray-500 mt-1">
                Antes de continuar, lee y acepta nuestros términos de uso.
              </p>
            </div>

            {showFullTerms ? (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {TERMS}
                </pre>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800">Al usar GetFresko aceptas:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-green-500">✓</span>Gestionar tu despensa de forma responsable</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span>Que tus datos de sesión se almacenen de forma segura</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span>Nuestra política de privacidad y uso del servicio</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullTerms(true)}
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
                >
                  Leer los términos y condiciones completos
                </button>
              </div>
            )}

            <div className="px-6 pb-8 pt-4 border-t border-gray-100 space-y-2">
              {showFullTerms && (
                <button
                  type="button"
                  onClick={() => setShowFullTerms(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Volver
                </button>
              )}
              <button
                onClick={handleAcceptTerms}
                className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98]"
              >
                Acepto los términos y condiciones
              </button>
            </div>
          </div>
        )}

        {/* Province step */}
        {step === 'province' && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900">¿Dónde estás?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tu provincia nos ayuda a personalizar la experiencia.
              </p>
            </div>

            <div className="px-6 py-5">
              <select
                value={province}
                onChange={e => { setProvince(e.target.value); setError(null) }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="">Selecciona tu provincia</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}
            </div>

            <div className="px-6 pb-8 pt-2 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={isPending || !province}
                className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                    </svg>
                    Guardando...
                  </>
                ) : 'Empezar a usar GetFresko'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
