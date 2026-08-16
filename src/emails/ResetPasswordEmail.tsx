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

export const ResetPasswordEmail = () => {
  return (
    <Html>
      <Head />
      <Preview>Redefina sua senha do Zebro.</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Redefinição de Senha
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Olá!
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Zebro</strong>.
              Se foi você quem fez este pedido, utilize o código de segurança abaixo para escolher uma nova senha.
            </Text>
            
            <Section className="bg-[#f4f4f4] rounded my-[16px] py-[16px] text-center">
              {/* NOTE: {{ .Token }} is used by Supabase to inject the 6-digit OTP code */}
              <Text className="text-[32px] font-bold tracking-[8px] text-[#000000] m-0 p-0">
                {"{{ .Token }}"}
              </Text>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Este código é válido por 24 horas. Insira-o na tela de recuperação de senha no site para continuar.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px] mt-[16px]">
              Se você não solicitou a alteração de senha, pode ignorar este e-mail com segurança (sua conta continua protegida).
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

export default ResetPasswordEmail;
