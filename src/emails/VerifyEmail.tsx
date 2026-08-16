import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

export const VerifyEmail = () => {
  return (
    <Html>
      <Head />
      <Preview>Confirme seu e-mail para acessar o Zebro.</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verifique seu E-mail
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Falta pouco para você começar!
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Para garantir a segurança da sua conta e concluir o seu cadastro no <strong>Zebro</strong>, precisamos que você confirme este endereço de e-mail clicando no botão abaixo.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              {/* NOTE: {{ .ConfirmationURL }} is a Supabase specific variable. 
                  When this HTML is pasted into Supabase, it will replace it with the real link. */}
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href="{{ .ConfirmationURL }}"
              >
                Confirmar meu E-mail
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Se você não se cadastrou no Zebro, por favor desconsidere este e-mail.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Zebro.site - Hospedagem de Vídeos Premium
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyEmail;
