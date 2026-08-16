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

interface WelcomeEmailProps {
  userName?: string;
  loginUrl?: string;
}

export const WelcomeEmail = ({
  userName = 'Usuário',
  loginUrl = 'https://www.zebro.site/dashboard',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao Zebro! Prepare-se para decolar.</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Bem-vindo ao <strong>Zebro</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Olá {userName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Estamos muito felizes em ter você conosco! O Zebro foi construído para ser a plataforma definitiva de hospedagem de vídeos para as suas aplicações e infoprodutos.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Você já pode começar a enviar seus primeiros vídeos e configurar o player com a sua marca.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={loginUrl}
              >
                Acessar meu Dashboard
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Se precisar de qualquer ajuda durante a configuração, nossa equipe de suporte está à disposição.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Este e-mail foi enviado por Zebro.site
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
