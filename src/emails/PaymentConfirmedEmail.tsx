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

interface PaymentConfirmedEmailProps {
  planName?: string;
  amount?: string;
  dashboardUrl?: string;
}

export const PaymentConfirmedEmail = ({
  planName = 'Zebro Premium',
  amount = 'R$ 297,00',
  dashboardUrl = 'https://www.zebro.site/dashboard',
}: PaymentConfirmedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Pagamento Confirmado: Assinatura {planName} ativada!</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Pagamento Confirmado 🎉
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Temos ótimas notícias!
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Seu pagamento no valor de <strong>{amount}</strong> foi processado com sucesso.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              A sua assinatura do <strong>{planName}</strong> já está ativa e todos os recursos premium foram liberados no seu espaço de trabalho.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={dashboardUrl}
              >
                Acessar meu Dashboard
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Obrigado por confiar no Zebro para hospedar os seus vídeos!
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

export default PaymentConfirmedEmail;
